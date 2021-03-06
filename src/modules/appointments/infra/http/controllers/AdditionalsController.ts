import { Request, Response } from 'express';

import { container } from 'tsyringe';

import UpdateAppointmentAdditionalsService from '@modules/appointments/services/UpdateAppointmentAdditionalsService';

export default class AdditionalsController {
  public async update(request: Request, response: Response): Promise<Response> {
    const { appointment_id, additional } = request.body;

    const updateAppointmentAdditionals = container.resolve(
      UpdateAppointmentAdditionalsService,
    );

    const appointment = await updateAppointmentAdditionals.execute({
      appointment_id,
      additional,
    });

    delete appointment.canceled_at;
    delete appointment.updated_at;

    return response.json(appointment);
  }
}
