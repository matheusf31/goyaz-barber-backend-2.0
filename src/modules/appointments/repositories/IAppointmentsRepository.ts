import IAppointmentDTO from '@modules/appointments/dtos/ICreateAppointmentDTO';
import IFindAllInDayFromProviderDTO from '../dtos/IFindAllInDayFromProviderDTO';
import IFindAllInMonthDTO from '../dtos/IFindAllInMonthDTO';
import IFindInMonthFromProviderDTO from '../dtos/IFindInMonthFromProviderDTO';
import IFindAllUserAppointmentsInMonthDTO from '../dtos/IFindAllUserAppointmentsInMonthDTO';

import Appointment from '../infra/typeorm/entities/Appointment';

export default interface AppointmentsRepository {
  create(data: IAppointmentDTO): Promise<Appointment>;
  save(appointment: Appointment): Promise<Appointment>;
  delete(appointment_id: string): Promise<void>;
  findById(appointment_id: string): Promise<Appointment | undefined>;
  findByDate(date: Date, provider_id: string): Promise<Appointment | undefined>;
  findExistentUserAppointment(
    user_id: string,
  ): Promise<Appointment | undefined>;
  findAllByProviderId(provider_id: string): Promise<Appointment[]>;
  findAllInDayFromProvider(
    data: IFindAllInDayFromProviderDTO,
  ): Promise<Appointment[]>;
  findAllInMonth(data: IFindAllInMonthDTO): Promise<Appointment[]>;
  findAllConcludedInMonth(
    data: IFindInMonthFromProviderDTO,
  ): Promise<Appointment[]>;
  findAllUserAppointmentsInMonth(
    data: IFindAllUserAppointmentsInMonthDTO,
  ): Promise<Appointment[]>;
}
