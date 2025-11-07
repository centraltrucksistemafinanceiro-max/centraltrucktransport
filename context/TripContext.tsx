import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Trip, Driver, Vehicle, FixedExpense, WorkshopExpense, Admin } from '../types';
import { getFirebaseDb } from '../firebase/config';
import { generateSalt, hashPassword } from '../utils/crypto';

// Tipo de entrada para a função addDriver, incluindo a senha em texto plano
type AddDriverInput = Omit<Driver, 'id' | 'status' | 'passwordHash' | 'salt'> & { password: string };
// Tipo de entrada para a função addAdmin, incluindo a senha em texto plano
type AddAdminInput = Omit<Admin, 'id' | 'passwordHash' | 'salt'> & { password: string };

interface TripContextType {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  admins: Admin[];
  fixedExpenses: FixedExpense[];
  workshopExpenses: WorkshopExpense[];
  isLoading: boolean;
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt'>) => Promise<void>;
  updateTrip: (trip: Trip) => Promise<void>;
  getTrip: (id: string) => Trip | undefined;
  addDriver: (driver: AddDriverInput) => Promise<void>;
  updateDriver: (driver: Driver) => Promise<void>;
  deleteDriver: (driverId: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'status'>) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  getDriver: (id: string) => Driver | undefined;
  getVehicle: (id: string) => Vehicle | undefined;
  getAdmin: (id: string) => Admin | undefined;
  addAdmin: (admin: AddAdminInput) => Promise<void>;
  updateAdmin: (admin: Admin) => Promise<void>;
  deleteAdmin: (adminId: string) => Promise<void>;
  addFixedExpense: (expense: Omit<FixedExpense, 'id' | 'createdAt' | 'payments'>) => Promise<void>;
  updateFixedExpense: (expense: FixedExpense) => Promise<void>;
  deleteFixedExpense: (expenseId: string) => Promise<void>;
  addWorkshopExpense: (expense: Omit<WorkshopExpense, 'id' | 'createdAt' | 'payments'>) => Promise<void>;
  updateWorkshopExpense: (expense: WorkshopExpense) => Promise<void>;
  deleteWorkshopExpense: (expenseId: string) => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
    const [workshopExpenses, setWorkshopExpenses] = useState<WorkshopExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const db = getFirebaseDb();
        const collections: { [key: string]: React.Dispatch<React.SetStateAction<any[]>> } = {
            trips: setTrips,
            drivers: setDrivers,
            vehicles: setVehicles,
            admins: setAdmins,
            fixedExpenses: setFixedExpenses,
            workshopExpenses: setWorkshopExpenses,
        };

        const unsubscribes = Object.entries(collections).map(([name, setter]) => {
            return db.collection(name).onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => {
                    const base = { id: doc.id, ...doc.data() } as any;
                    if (name === 'drivers' || name === 'admins') {
                        delete base.password;
                        delete base.passwordHash;
                        delete base.salt;
                    }
                    return base;
                });
                setter(data);
            }, (error: Error) => {
                console.error(`Error fetching ${name}:`, error);
                if (error.message.includes("Missing or insufficient permissions")) {
                    console.error("Erro de permissão no Firebase. Verifique as regras de segurança do Firestore.");
                }
            });
        });

        const checkInitialData = async () => {
            try {
                const shouldSeed = (window as any).__ENABLE_SEED__ === true;
                if (shouldSeed) {
                    const adminSnapshot = await db.collection('admins').get();
                    if (adminSnapshot.empty) {
                        console.log("No admins found, creating initial admin 'FELIPE'...");
                        const salt = generateSalt();
                        const passwordHash = await hashPassword('123451', salt);
                        await db.collection('admins').add({ name: 'FELIPE', passwordHash, salt });
                    }

                    const driverSnapshot = await db.collection('drivers').get();
                    if (driverSnapshot.empty) {
                        console.log("No drivers found, creating initial driver 'PAULO'...");
                        const salt = generateSalt();
                        const passwordHash = await hashPassword('123451', salt);
                        await db.collection('drivers').add({ name: 'PAULO', cnh: '111222333', phone: '11999998888', status: 'active', passwordHash, salt });
                    }
                }
            } catch (error) {
                console.error("Error checking/seeding initial data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkInitialData();

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

  const addTrip = async (trip: Omit<Trip, 'id' | 'createdAt'>) => {
    const db = getFirebaseDb();
    const startDate = new Date(trip.startDate + 'T00:00:00');
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    
    // Filtro manual, pois o estado 'trips' pode não estar atualizado imediatamente
    const tripsInMonthForDriver = trips.filter(t => {
        if (t.driverId !== trip.driverId) return false;
        const tDate = new Date(t.startDate + 'T00:00:00');
        return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    const monthlyTripNumber = tripsInMonthForDriver.length + 1;
    
    const newTrip = {
      ...trip,
      createdAt: new Date().toISOString(),
      monthlyTripNumber,
    };
    await db.collection('trips').add(newTrip);
  };
  
  const updateTrip = async (updatedTrip: Trip) => {
    const db = getFirebaseDb();
    const { id, ...tripData } = updatedTrip;
    await db.collection('trips').doc(id).update(tripData);
  };

  const getTrip = (id: string) => trips.find(t => t.id === id);

  const addDriver = async (driver: AddDriverInput) => {
    const db = getFirebaseDb();
    if ((driver.password || '').trim().length === 0) {
        throw new Error('A senha não pode ser vazia.');
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(driver.password, salt);
    const newDriver = { 
        name: (driver.name || '').trim().toUpperCase(),
        cnh: driver.cnh,
        phone: driver.phone,
        status: 'active',
        passwordHash,
        salt,
    };
    await db.collection('drivers').add(newDriver);
  };
  
  const updateDriver = async (updatedDriver: Driver) => {
    const db = getFirebaseDb();
    const { id, ...driverData } = updatedDriver;
    await db.collection('drivers').doc(id).update(driverData);
  };

  const deleteDriver = async (driverId: string) => {
    const db = getFirebaseDb();
    await db.collection('drivers').doc(driverId).delete();
  };

  const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'status'>) => {
    const db = getFirebaseDb();
    const newVehicle = { ...vehicle, status: 'active' };
    await db.collection('vehicles').add(newVehicle);
  };
  
  const updateVehicle = async (updatedVehicle: Vehicle) => {
    const db = getFirebaseDb();
    const { id, ...vehicleData } = updatedVehicle;
    await db.collection('vehicles').doc(id).update(vehicleData);
  };

  const deleteVehicle = async (vehicleId: string) => {
    const db = getFirebaseDb();
    await db.collection('vehicles').doc(vehicleId).delete();
  };
  
  const getDriver = (id: string) => drivers.find(d => d.id === id);
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);
  
  const addAdmin = async (admin: AddAdminInput) => {
    const db = getFirebaseDb();
    if ((admin.password || '').trim().length === 0) {
        throw new Error('A senha não pode ser vazia.');
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(admin.password, salt);
    const newAdmin = { 
        name: (admin.name || '').trim().toUpperCase(),
        passwordHash,
        salt,
    };
    await db.collection('admins').add(newAdmin);
  };

  const updateAdmin = async (updatedAdmin: Admin) => {
    const db = getFirebaseDb();
    const { id, ...adminData } = updatedAdmin;
    await db.collection('admins').doc(id).update(adminData);
  };

  const deleteAdmin = async (adminId: string) => {
    const db = getFirebaseDb();
    await db.collection('admins').doc(adminId).delete();
  };
  
  const getAdmin = (id: string) => admins.find(a => a.id === id);

  const addFixedExpense = async (expense: Omit<FixedExpense, 'id' | 'createdAt' | 'payments'>) => {
    const db = getFirebaseDb();
    const newExpense = {
      ...expense,
      createdAt: new Date().toISOString(),
      payments: [],
    };
    await db.collection('fixedExpenses').add(newExpense);
  };

  const updateFixedExpense = async (updatedExpense: FixedExpense) => {
    const db = getFirebaseDb();
    const { id, ...expenseData } = updatedExpense;
    await db.collection('fixedExpenses').doc(id).update(expenseData);
  };

  const deleteFixedExpense = async (expenseId: string) => {
    const db = getFirebaseDb();
    await db.collection('fixedExpenses').doc(expenseId).delete();
  };

  const addWorkshopExpense = async (expense: Omit<WorkshopExpense, 'id' | 'createdAt' | 'payments'>) => {
    const db = getFirebaseDb();
    const newExpense = {
      ...expense,
      createdAt: new Date().toISOString(),
      payments: [],
    };
    await db.collection('workshopExpenses').add(newExpense);
  };

  const updateWorkshopExpense = async (updatedExpense: WorkshopExpense) => {
    const db = getFirebaseDb();
    const { id, ...expenseData } = updatedExpense;
    await db.collection('workshopExpenses').doc(id).update(expenseData);
  };

  const deleteWorkshopExpense = async (expenseId: string) => {
    const db = getFirebaseDb();
    await db.collection('workshopExpenses').doc(expenseId).delete();
  };

  return (
    <TripContext.Provider value={{ 
        trips, drivers, vehicles, admins, fixedExpenses, workshopExpenses, isLoading,
        addTrip, updateTrip, getTrip, 
        addDriver, updateDriver, deleteDriver,
        addVehicle, updateVehicle, deleteVehicle,
        getDriver, getVehicle,
        getAdmin, addAdmin, updateAdmin, deleteAdmin,
        addFixedExpense, updateFixedExpense, deleteFixedExpense,
        addWorkshopExpense, updateWorkshopExpense, deleteWorkshopExpense
     }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};
