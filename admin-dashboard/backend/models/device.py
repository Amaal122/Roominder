from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from database import Base

class UserDevice(Base):

    __tablename__ = "user_devices"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    device_id = Column(String)

    platform = Column(String)

    os_name = Column(String)

    os_version = Column(String)

    device_model = Column(String)

    last_ip = Column(String)

    is_trusted = Column(Boolean, default=False)