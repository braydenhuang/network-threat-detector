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
    
    def report_success(self, file: FileStorage):
        self.filename = file.filename
        self.success = True
        
        file.seek(0, SEEK_END)
        self.filesize = file.tell()
        
        self.message = "File uploaded successfully!"
        
    def new(filename="", success=False, filesize=0, message=None):
        return UploadResponse(
            filename=filename,
            success=success,
            filesize=filesize,
            message=message
        )