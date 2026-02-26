from flask_sqlalchemy import SQLAlchemy
import enum
from datetime import datetime, timezone

db = SQLAlchemy()


class TicketCategory(enum.Enum):
    BUG = "BUG"
    FEATURE = "FEATURE"
    BILLING = "BILLING"
    UNCATEGORIZED = "UNCATEGORIZED"

class TicketPriority(enum.Enum):
    HIGH = "HIGH"
    NORMAL = "NORMAL"
    LOW = "LOW"

class TicketStatus(enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_message = db.Column(db.Text, nullable=False)
    
  
    category = db.Column(db.Enum(TicketCategory), default=TicketCategory.UNCATEGORIZED, nullable=False)
    priority = db.Column(db.Enum(TicketPriority), default=TicketPriority.NORMAL, nullable=False)
    status = db.Column(db.Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False)
    
   
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_message": self.customer_message,
            "category": self.category.value,
            "priority": self.priority.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat()
        }