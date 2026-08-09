import { DummyData } from '../constants/DummyData';
import { DatewiseReportRow, MachineReportRow } from '../types/report';

export interface ReportState {
  datewiseRows: DatewiseReportRow[];
  machineSummary: MachineReportRow[];
  month: string;
}

export const initialReportState: ReportState = {
  datewiseRows: DummyData.reports.datewiseRows as DatewiseReportRow[],
  machineSummary: DummyData.reports.machineSummary as MachineReportRow[],
  month: 'मे - 2024',
};
