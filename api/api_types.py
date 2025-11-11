# Define types here with pydantic-to-typescript. 
# Use ../generate_typescript.sh to transfer these types to the frontend.

from pydantic import BaseModel
from typing import Optional

class Service(BaseModel):
    working: bool
    message: Optional[str]
    
    def new(working: bool = True, message: Optional[str] = None):
        return Service(working=working, message=message)

class Health(BaseModel):
    redis: Service
    
    def all_good(self) -> bool:
        return all(service.working for _, service in vars(self).items())