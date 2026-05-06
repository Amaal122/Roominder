from backend.db import SessionLocal
from backend.backend_propertyowner.models import Property
from backend.backend_user.models import User

def test_props():
    db = SessionLocal()
    available_props = db.query(Property).limit(50).all()
    properties_data = []
    for prop in available_props:
        owner = db.query(User).filter(User.id == prop.owner_id).first()
        owner_name = owner.full_name if owner and owner.full_name else f"Proprietaire {prop.owner_id}"
        owner_contact = owner.email if owner else "Non precise"
        
        properties_data.append(
            f"- **{prop.title}** : {prop.rooms} chambre(s), {prop.space} m2, Prix: {prop.price} DT. "
            f"Lieu: {prop.city}, {prop.address}. Contact: {owner_name} ({owner_contact})"
        )
    print("PROPERTIES FOUND:", len(properties_data))
    for p in properties_data[:3]:
        print(p)

if __name__ == '__main__':
    test_props()
