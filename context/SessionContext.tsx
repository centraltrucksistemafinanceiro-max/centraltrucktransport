import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { Driver, Admin } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTrips } from './TripContext';
import { verifyPassword, generateSalt, hashPassword } from '../utils/crypto';
import { getFirebaseDb } from '../firebase/config';

interface User {
  name: string;
  role: 'admin' | 'driver';
  driverId: string | null; // For driver-specific views
  userId: string;
}

interface Session {
  user: User | null;
  expiresAt?: number;
}

interface SessionContextType {
  session: Session;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (userId: string, userType: 'driver' | 'admin', newPassword: string, oldPassword?: string) => Promise<{ success: boolean; message: string; }>;
  currentDriverId: string | null;
  currentDriver: Driver | undefined;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useLocalStorage<Session>('session', { user: null });
  const { drivers, getDriver } = useTrips();

  useEffect(() => {
    if (!session.user || !session.expiresAt) return;
    const now = Date.now();
    if (session.expiresAt <= now) {
      setSession({ user: null });
      return;
    }
    const timeout = setTimeout(() => {
      setSession({ user: null });
    }, session.expiresAt - now);
    return () => clearTimeout(timeout);
  }, [session, setSession]);

  const login = async (username: string, password: string): Promise<boolean> => {
    const uname = (username || '').trim().toUpperCase();
    const pwd = (password || '').trim();
    if (uname.length === 0 || pwd.length === 0) {
      await new Promise(r => setTimeout(r, 300));
      return false;
    }
    const attemptsKey = 'loginAttempts_v1';
    const raw = localStorage.getItem(attemptsKey);
    const now = Date.now();
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000;
    const lockMs = 15 * 60 * 1000;
    const data: Record<string, { count: number; last: number; lockUntil?: number }> = raw ? JSON.parse(raw) : {};
    const rec = data[uname];
    if (rec && rec.lockUntil && now < rec.lockUntil) {
      await new Promise(r => setTimeout(r, 500));
      return false;
    }
    if (rec && now - rec.last > windowMs) {
      data[uname] = { count: 0, last: now };
    }
    await new Promise(r => setTimeout(r, 300 + Math.min((rec?.count || 0) * 150, 1500)));
    const db = getFirebaseDb();
    
    try {
      // Check admins
      const adminQuery = await db.collection('admins').where('name', '==', uname).limit(1).get();
      if (!adminQuery.empty) {
        const adminDoc = adminQuery.docs[0];
        const admin = { id: adminDoc.id, ...adminDoc.data() } as Admin;
        if (admin.salt && admin.passwordHash) {
          const isValid = await verifyPassword(pwd, admin.salt, admin.passwordHash);
          if (isValid) {
            const exp = Date.now() + 8 * 60 * 60 * 1000;
            setSession({ user: { name: `${admin.name} (Admin)`, role: 'admin', driverId: null, userId: admin.id }, expiresAt: exp });
            if (data[uname]) delete data[uname];
            localStorage.setItem(attemptsKey, JSON.stringify(data));
            return true;
          }
        }
      }

      // Check drivers
      const driverQuery = await db.collection('drivers').where('name', '==', uname).limit(1).get();
      if (!driverQuery.empty) {
        const driverDoc = driverQuery.docs[0];
        const driver = { id: driverDoc.id, ...driverDoc.data() } as Driver;
         if (driver.salt && driver.passwordHash) {
            const isValid = await verifyPassword(pwd, driver.salt, driver.passwordHash);
            if (isValid) {
              const exp = Date.now() + 8 * 60 * 60 * 1000;
              setSession({ user: { name: driver.name, role: 'driver', driverId: driver.id, userId: driver.id }, expiresAt: exp });
              if (data[uname]) delete data[uname];
              localStorage.setItem(attemptsKey, JSON.stringify(data));
              return true;
            }
         }
      }
    } catch (error) {
        console.error("Login error:", error);
        await new Promise(r => setTimeout(r, 400));
        const rec2 = data[uname] || { count: 0, last: now };
        const count = now - rec2.last > windowMs ? 1 : (rec2.count + 1);
        const lockUntil = count >= maxAttempts ? now + lockMs : rec2.lockUntil;
        data[uname] = { count, last: now, lockUntil };
        localStorage.setItem(attemptsKey, JSON.stringify(data));
        return false;
    }
    
    const rec3 = data[uname] || { count: 0, last: now };
    const count = now - rec3.last > windowMs ? 1 : (rec3.count + 1);
    const lockUntil = count >= maxAttempts ? now + lockMs : rec3.lockUntil;
    data[uname] = { count, last: now, lockUntil };
    localStorage.setItem(attemptsKey, JSON.stringify(data));
    return false;
  };

  const logout = () => {
    setSession({ user: null });
  };

  const changePassword = async (userId: string, userType: 'driver' | 'admin', newPassword: string, oldPassword?: string): Promise<{ success: boolean, message: string }> => {
    const db = getFirebaseDb();
    const collectionName = userType === 'driver' ? 'drivers' : 'admins';
    const userDocRef = db.collection(collectionName).doc(userId);
    
    try {
        if ((newPassword || '').trim().length === 0) {
            return { success: false, message: 'A nova senha não pode ser vazia.' };
        }
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return { success: false, message: 'Usuário não encontrado.' };
        }
        const userToUpdate = userDoc.data();

        // If oldPassword is provided, a user is changing their own password
        if (oldPassword) {
            if (!userToUpdate.salt || !userToUpdate.passwordHash) {
                return { success: false, message: 'Conta de usuário antiga. Contate um administrador para resetar sua senha.' };
            }
            const isMatch = await verifyPassword(oldPassword, userToUpdate.salt, userToUpdate.passwordHash);
            if (!isMatch) {
                return { success: false, message: 'Senha atual incorreta.' };
            }
        } 
        // If oldPassword is NOT provided, an admin is resetting a password
        else {
            if (session.user?.role !== 'admin') {
                return { success: false, message: 'Apenas administradores podem resetar senhas.' };
            }
        }
        
        const newSalt = generateSalt();
        const newHash = await hashPassword(newPassword, newSalt);

        await userDocRef.update({ passwordHash: newHash, salt: newSalt });
        return { success: true, message: 'Senha alterada com sucesso!' };

    } catch (error) {
        console.error("Change password error:", error);
        return { success: false, message: 'Ocorreu um erro ao alterar a senha.'};
    }
  };

  const currentDriverId = useMemo(() => session.user?.driverId || null, [session]);
  const currentDriver = useMemo(() => {
    // getDriver uses the real-time list from TripContext, which is efficient.
    return currentDriverId ? getDriver(currentDriverId) : undefined;
  }, [currentDriverId, getDriver, drivers]); // add drivers to dependency array

  const value = { session, login, logout, currentDriverId, currentDriver, changePassword };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
