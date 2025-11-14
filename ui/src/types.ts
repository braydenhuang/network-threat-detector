/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface Assignment {
  id: string;
  stages: Stage[];
}
export interface Stage {
  id: string | null;
  name: string;
  description: string | null;
}
export interface Health {
  redis: Service;
  s3: Service;
}
export interface Service {
  working: boolean;
  message: string | null;
}
export interface HealthCheckResult {
  success: boolean;
  message: string | null;
  next_job_id: string | null;
  health: Health;
}
export interface JobResponse {
  id: string;
  status: string;
  queue: string;
  enqeued_at: string | null;
  ended_at: string | null;
  result: JobResult | null;
}
export interface JobResult {
  success: boolean;
  message: string | null;
  next_job_id: string | null;
}
export interface UploadResponse {
  filename: string;
  success: boolean;
  filesize: number;
  message: string | null;
  assignment_id: string | null;
}
