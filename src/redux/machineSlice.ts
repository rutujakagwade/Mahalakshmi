import { Machine, MachineEntry } from '../types/machine';
import { DummyData } from '../constants/DummyData';

export interface MachineState {
  machines: Machine[];
  machineEntries: MachineEntry[];
}

export const initialMachineState: MachineState = {
  machines: DummyData.machines as Machine[],
  machineEntries: [
    {
      id: 'me1',
      date: '20/05/2024',
      machineId: 'm1',
      machineName: 'JCB 3DX',
      customerId: 'c1',
      customerName: 'संतोष पाटील',
      location: 'गोकुळ शिरगाव',
      workDescription: 'खाड्डा खणकाम',
      hoursOrTrips: '8 तास',
      amount: 12000,
      paymentType: 'रोख',
    },
    {
      id: 'me2',
      date: '20/05/2024',
      machineId: 'm2',
      machineName: 'POCLAIN 210',
      customerId: 'c3',
      customerName: 'विकास देसाई',
      location: 'कोल्हापूर',
      workDescription: 'माती भराव',
      hoursOrTrips: '7 तास',
      amount: 15500,
      paymentType: 'रोख',
    },
    {
      id: 'me3',
      date: '20/05/2024',
      machineId: 'm3',
      machineName: 'TATA TIPPER',
      customerId: 'c2',
      customerName: 'राजेश जाधव',
      location: 'कागल',
      workDescription: 'दगड वाहतूक',
      hoursOrTrips: '6 फेऱ्या',
      amount: 8700,
      paymentType: 'ऑनलाइन',
    }
  ],
};
