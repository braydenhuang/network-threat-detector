# Define types here with pydantic-to-typescript. 
# Use ../generate_typescript.sh to transfer these types to the frontend.

from werkzeug.datastructures import FileStorage
from pydantic import BaseModel
from typing import Optional
from os import SEEK_END

class Service(BaseModel):
    working: bool
    message: Optional[str]
    
    def new(working: bool = True, message: Optional[str] = None):
        return Service(working=working, message=message)

class Health(BaseModel):
    redis: Service
    s3: Service
    
    def all_good(self) -> bool:
        return all(service.working for _, service in vars(self).items())
    
class UploadResponse(BaseModel):
    filename: str
    success: bool
    filesize: int
    message: Optional[str]
    
    job_id: Optional[str]
    
    def report_success(self, file: FileStorage, file_size: int = 0, job_id: Optional[str] = None):
        self.filename = file.filename
        self.success = True
        
        self.filesize = file_size # Getting file size without reading the whole file into memory is tricky
        
        self.message = "File uploaded successfully!"
        
        self.job_id = job_id
        
    def new(filename="", success=False, filesize=0, message=None, job_id=None):
        return UploadResponse(
            filename=filename,
            success=success,
            filesize=filesize,
            message=message,
            job_id=job_id
        )
        
class JobResult(BaseModel):
    success: bool
    message: Optional[str]
    
class HealthCheckResult(JobResult):
    health: Health
    
    def new(health: Health, success=False, message: Optional[str] = None):
        return HealthCheckResult(success=success, message=message, health=health)
    
class CICFlowMeterResult(JobResult):
    ml_job_id: Optional[str]
    flow_s3_key: Optional[str]
    
    def new(success: bool = False, message: Optional[str] = None, ml_job_id: Optional[str] = None, flow_s3_key: Optional[str] = None):
        return CICFlowMeterResult(success=success, message=message, ml_job_id=ml_job_id, flow_s3_key=flow_s3_key)