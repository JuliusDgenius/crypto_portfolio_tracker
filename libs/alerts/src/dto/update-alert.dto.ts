import { IsEnum } from "class-validator";
import { AlertStatus } from "../types";

import { ApiProperty } from "@nestjs/swagger";

export class UpdateAlertStatusDto {
    @ApiProperty({
      enum: AlertStatus,
      description: 'The new status to set for the alert'
    })
    @IsEnum(AlertStatus)
    status: AlertStatus;
  }