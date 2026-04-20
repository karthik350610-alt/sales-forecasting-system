import { format, addDays, getMonth, isWeekend } from 'date-fns';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  limit,
  writeBatch,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { SalesData } from '../types';

export const fetchSalesFromFirestore = async (userId: string): Promise<SalesData[]> => {
  try {
    const q = query(
      collection(db, 'salesRecords'),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Remove Firebase-specific fields if needed, but SalesData is a subset
      return {
        date: data.date,
        storeId: data.storeId,
        productId: data.productId,
        sales: data.sales,
        promotion: data.promotion,
        holiday: data.holiday,
        temperature: data.temperature,
        fuelPrice: data.fuelPrice,
        cpi: data.cpi,
        unemployment: data.unemployment,
      } as SalesData;
    });
  } catch (error) {
    console.error("Error fetching sales from Firestore:", error);
    return handleFirestoreError(error, 'list', 'salesRecords');
  }
};

export const saveSalesRecord = async (userId: string, data: Omit<SalesData, 'userId'>) => {
  try {
    await addDoc(collection(db, 'salesRecords'), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving sales record:", error);
    return handleFirestoreError(error, 'create', 'salesRecords');
  }
};

export const seedInitialData = async (userId: string) => {
  const batch = writeBatch(db);
  const data = generateSyntheticData(90); // Seed 90 days
  
  data.forEach((record) => {
    const newDocRef = doc(collection(db, 'salesRecords'));
    batch.set(newDocRef, {
      ...record,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error seeding initial data:", error);
    return handleFirestoreError(error, 'write', 'salesRecords');
  }
};

export const generateSyntheticData = (
  daysCount: number = 365,
  storeCount: number = 1,
  productCount: number = 1
): SalesData[] => {
  const data: SalesData[] = [];
  const startDate = new Date(2023, 0, 1);

  for (let s = 1; s <= storeCount; s++) {
    for (let p = 1; p <= productCount; p++) {
      for (let i = 0; i < daysCount; i++) {
        const currentDate = addDays(startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const month = getMonth(currentDate);
        
        // Features
        const holiday = (month === 11 && (currentDate.getDate() >= 24)) || // Xmas
                        (month === 0 && currentDate.getDate() === 1) || // New Year
                        (month === 6 && currentDate.getDate() === 4) ? 1 : 0; // July 4th
        
        const promotion = Math.random() < 0.15 ? 1 : 0;
        const temperature = 20 + 15 * Math.sin((2 * Math.PI * (i + 150)) / 365) + (Math.random() * 5 - 2.5);
        const fuelPrice = 3.5 + 0.5 * Math.sin((2 * Math.PI * i) / 500) + (Math.random() * 0.2 - 0.1);
        const cpi = 250 + 0.05 * i + (Math.random() * 2 - 1);
        const unemployment = 7.5 - 0.002 * i + (Math.random() * 0.5 - 0.25);

        // Sales logic: Base + Seasonality + Holiday + Promo + Noise
        let baseSales = 1000;
        
        // Weekly seasonality (weekends are busier)
        if (isWeekend(currentDate)) {
          baseSales *= 1.3;
        }

        // Yearly seasonality (Winter boost)
        const yearlySeasonality = 1 + 0.2 * Math.cos((2 * Math.PI * (i - 355)) / 365);
        
        // Boosts
        const promoBoost = promotion ? 1.4 : 1.0;
        const holidayBoost = holiday ? 1.8 : 1.0;
        
        // Random noise
        const noise = 1 + (Math.random() * 0.2 - 0.1);

        const sales = Math.round(baseSales * yearlySeasonality * promoBoost * holidayBoost * noise);

        data.push({
          date: dateStr,
          storeId: `STORE_${s}`,
          productId: `PROD_${p}`,
          sales,
          promotion,
          holiday,
          temperature,
          fuelPrice,
          cpi,
          unemployment
        });
      }
    }
  }

  return data;
};
