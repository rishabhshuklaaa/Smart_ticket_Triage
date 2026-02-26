from flask import Flask, request, jsonify
from flask_cors import CORS
from pydantic import BaseModel, ValidationError
from models import db, Ticket, TicketCategory, TicketPriority, TicketStatus
from services import categorize_ticket_with_ai

app = Flask(__name__)
CORS(app) 

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tickets.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create database tables automatically
with app.app_context():
    db.create_all()

# INTERFACE SAFETY: Pydantic Schema
class TicketCreateSchema(BaseModel):
    customer_message: str

@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    try:
        # 1. Validation
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        # 2. Validation: Content check (Pydantic)
        validated_data = TicketCreateSchema(**data)
        
        if not validated_data.customer_message.strip():
            return jsonify({"error": "Message cannot be empty string"}), 400

        # 3. Business Logic: Call AI Service
        ai_decision = categorize_ticket_with_ai(validated_data.customer_message)

        # 4. Save to Database
        new_ticket = Ticket(
            customer_message=validated_data.customer_message,
            category=TicketCategory(ai_decision['category']),
            priority=TicketPriority(ai_decision['priority'])
        )
        
        db.session.add(new_ticket)
        db.session.commit()

        return jsonify(new_ticket.to_dict()), 201

    except ValidationError as e:
        # Catch Pydantic validation errors securely
        return jsonify({"error": "Validation Failed", "details": e.errors()}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    # Fetch all tickets, newest first
    tickets = Ticket.query.order_by(Ticket.id.asc()).all()
    return jsonify([ticket.to_dict() for ticket in tickets]), 200

@app.route('/api/tickets/<int:ticket_id>/resolve', methods=['PATCH'])
def resolve_ticket(ticket_id):
    try:
        
        ticket = Ticket.query.get(ticket_id)
        
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        
        if ticket.status == TicketStatus.RESOLVED:
            return jsonify({"error": "Ticket is already resolved"}), 400

        # 3. State Change: OPEN -> RESOLVED
        ticket.status = TicketStatus.RESOLVED
        db.session.commit()

        return jsonify({"message": "Ticket resolved successfully", "ticket": ticket.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)