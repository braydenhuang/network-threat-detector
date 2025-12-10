# Define types here with pydantic-to-typescript. 
# Use ../generate_typescript.sh to transfer these types to the frontend.

from functools import reduce
from werkzeug.datastructures import FileStorage
from pydantic import BaseModel
from typing import Optional
from uuid import uuid4
from enum import Enum

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
    
class Stage(BaseModel):
    id: Optional[str]
    
    name: str
    description: Optional[str]
    
    def new_cicflowmeter_stage(id: Optional[str] = None):
        return Stage(
            id=id,
            name="Converting PCAP to CSE-CIC-IDS2018 Flows",
            description="Processing the uploaded pcap with CICFlowMeter-V3 to extract 80+ network flow parameters."
        )
        
    def new_ml_stage(id: Optional[str] = None):
        return Stage(
            id=id,
            name="Machine Learning Analysis",
            description="Analyzing the extracted network flow features using machine learning to detect potential threats."
        )
    
class Assignment(BaseModel):
    id: str
    stages: list[Stage]
    
    def new(new_id: str | None = None, stages: list[Stage] = []):
        if new_id is None:
            new_id = str(uuid4())
        
        return Assignment(id=new_id, stages=stages)
    
class UploadResponse(BaseModel):
    filename: str
    success: bool
    filesize: int
    message: Optional[str]
    
    assignment_id: Optional[str]
    
    def report_success(self, file: FileStorage, file_size: int = 0, assignment_id: Optional[str] = None):
        self.filename = file.filename
        self.success = True
        
        self.filesize = file_size # Getting file size without reading the whole file into memory is tricky
        
        self.message = "File uploaded successfully!"
        
        self.assignment_id = assignment_id
        
    def new(filename="", success=False, filesize=0, message=None, assignment_id=None):
        return UploadResponse(
            filename=filename,
            success=success,
            filesize=filesize,
            message=message,
            assignment_id=assignment_id
        )
        
class JobResult(BaseModel):
    success: bool
    message: Optional[str]
    
    next_job_id: Optional[str]
    
    def new(success: bool = False, message: Optional[str] = None, next_job_id: Optional[str] = None):
        return JobResult(success=success, message=message, next_job_id=next_job_id)
    
    def create_from(json: str):
        result_types = Prediction.values()
        is_ml_result = reduce(lambda accumumator, value: accumumator or (f"\"prediction\":\"{value}\"" in json), result_types, False)
        
        if is_ml_result:
            return MLJobResult.model_validate_json(json)
        
        return JobResult.model_validate_json(json)
    
class Prediction(str, Enum):
    BENIGN = "BENIGN"
    MALICIOUS = "MALICIOUS"
    
    def values():
        return [member.name for member in Prediction]
    
    def __str__(self):
        match self:
            case Prediction.BENIGN:
                return "benign"
            case Prediction.MALICIOUS:
                return "malicious"

class MLJobResult(JobResult):
    prediction: Optional[Prediction]
    
    def new(success: bool = False, message: Optional[str] = None, next_job_id: Optional[str] = None, prediction: Optional[Prediction] = None):
        return MLJobResult(success=success, message=message, next_job_id=next_job_id, prediction=prediction)
    
class HealthCheckResult(JobResult):
    health: Health
    
    def new(health: Health, success=False, message: Optional[str] = None):
        return HealthCheckResult(success=success, message=message, health=health)
    
class JobResponse(BaseModel):
    id: str
    status: str
    queue: str
    enqeued_at: Optional[str]
    ended_at: Optional[str]
    result: Optional[JobResult | MLJobResult]