from typing import Optional, Dict
from pydantic import BaseModel

class SettingOut(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class SettingsUpdateDict(BaseModel):
    settings: Dict[str, str]
