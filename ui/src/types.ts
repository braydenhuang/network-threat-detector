/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface Health {
  redis: Service;
  s3: Service;
}
export interface Service {
  working: boolean;
  message: string | null;
}
export interface UploadResponse {
  filename: string;
  success: boolean;
  filesize: number;
  message: string | null;
}
