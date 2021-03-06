import { injectable, inject } from 'tsyringe';
import {
  isAfter,
  isSaturday,
  isSunday,
  format,
  subMinutes,
  endOfDay,
  isEqual,
} from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import IUnavailablesRepository from '@modules/unavailables/repositories/IUnavailablesRepository';
import IAppointmentsRepository from '../repositories/IAppointmentsRepository';

import Appointment from '../infra/typeorm/entities/Appointment';

interface IRequest {
  provider_id: string;
  day: number;
  month: number;
  year: number;
}

type IResponse = Array<{
  time: string;
  available: boolean;
  appointment?: Appointment;
  past: boolean;
  providerBusy: boolean | undefined;
}>;

@injectable()
class ListProviderDayAvailabilityService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,

    @inject('UnavailablesRepository')
    private unavailablesRepository: IUnavailablesRepository,
  ) {}

  public async execute({
    provider_id,
    day,
    month,
    year,
  }: IRequest): Promise<IResponse> {
    const appointmentsPromise = this.appointmentsRepository.findAllInDayFromProvider(
      {
        provider_id,
        day,
        month,
        year,
      },
    );

    const unavailableHoursPromise = this.unavailablesRepository.findAllInDayUnavailable(
      {
        provider_id,
        day,
        month,
        year,
      },
    );

    const [appointments, unavailableHours] = await Promise.all([
      appointmentsPromise,
      unavailableHoursPromise,
    ]);

    const schedule = [];

    const currentDate = new Date(Date.now());

    const searchDate = new Date(year, month - 1, day);

    const hasDayBusy = unavailableHours.find(unavailable => {
      return isEqual(unavailable.date, endOfDay(searchDate));
    });

    if (isSaturday(new Date(year, month - 1, day))) {
      schedule.push(
        '09:00',
        '09:30',
        '10:00',
        '10:30',
        '11:00',
        '11:30',
        '12:00',
        '12:30',
        '13:00',
        '13:30',
        '14:00',
        '14:30',
        '15:00',
        '15:30',
        '16:00',
        '16:30',
        '17:00',
      );
    } else {
      schedule.push(
        '09:00',
        '09:30',
        '10:00',
        '10:30',
        '11:00',
        '11:30',
        '12:00',
        '12:30',
        '13:00',
        '13:30',
        '14:00',
        '14:30',
        '15:00',
        '15:30',
        '16:00',
        '16:30',
        '17:00',
        '17:30',
        '18:00',
        '18:30',
        '19:00',
      );
    }

    const availability = schedule.map(time => {
      const [hour, minute] = time.split(':');

      const searchDateTime = new Date(
        year,
        month - 1,
        day,
        Number(hour),
        Number(minute),
      );

      const hasUnavailableInHour = unavailableHours.find(
        unavailable => format(unavailable.date, 'HH:mm') === time,
      );

      const hasAppointmentInHour = appointments.find(
        appointment => format(appointment.date, 'HH:mm') === time,
      );

      if (hasAppointmentInHour) {
        hasAppointmentInHour.additionals.services = JSON.parse(
          hasAppointmentInHour.additionals.services,
        );
      }

      /**
       * checking thirty minutes in advance if there is a service whose duration is one hour
       */
      const hasHourlyServiceThirtyMinutesFromTheSearchDateTime = appointments.find(
        appointment => {
          const thirtyMinutesInPast = format(
            subMinutes(searchDateTime, 30),
            'HH:mm',
          );

          return (
            format(appointment.date, 'HH:mm') === thirtyMinutesInPast &&
            (appointment.service === 'corte e barba' ||
              appointment.service === 'corte e hot towel')
          );
        },
      );

      const providerPreBusy =
        (time === '12:00' || time === '12:30' || time === '13:00') &&
        !hasUnavailableInHour;

      return {
        time,
        timeFormatted: format(searchDateTime, "yyyy-MM-dd'T'HH:mm:ssxxx", {
          locale: ptBR,
        }),
        available:
          !hasAppointmentInHour &&
          isAfter(searchDateTime, currentDate) &&
          !isSunday(searchDateTime) &&
          !hasHourlyServiceThirtyMinutesFromTheSearchDateTime &&
          !hasUnavailableInHour?.is_unavailable === true &&
          !providerPreBusy &&
          !hasDayBusy?.is_unavailable === true,
        appointment: hasAppointmentInHour,
        past: !isAfter(searchDateTime, currentDate),
        providerBusy: hasUnavailableInHour?.is_unavailable || providerPreBusy,
        dayBusy: hasDayBusy?.is_unavailable,
      };
    });

    return availability;
  }
}

export default ListProviderDayAvailabilityService;
