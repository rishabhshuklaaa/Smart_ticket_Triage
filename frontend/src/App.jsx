import { useState, useEffect } from 'react'

function App() {
  const [currentView, setCurrentView] = useState('customer')
  const [tickets, setTickets] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  
  // NAYA FEATURE: Stats track karne ke liye
  const [stats, setStats] = useState({ resolved: 0, unresolved: 0 })

  const API_URL = 'http://127.0.0.1:5000/api/tickets'

  const fetchTickets = async () => {
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      
      // Data ko filter aur count karo
      const openTickets = data.filter(ticket => ticket.status === 'OPEN')
      const resolvedTickets = data.filter(ticket => ticket.status === 'RESOLVED')
      
      setTickets(openTickets)
      
      // Stats update karo
      setStats({
        resolved: resolvedTickets.length,
        unresolved: openTickets.length
      })

    } catch (err) {
      setError('Cannot connect to backend server.')
    }
  }

  useEffect(() => {
    if (currentView === 'admin') {
      fetchTickets()
    }
  }, [currentView])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('Message cannot be empty')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMsg('')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_message: message }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit')
      }

      setMessage('')
      setSuccessMsg('Your ticket has been submitted successfully!')
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // UPDATED FEATURE: Confirmation Box se Resolve karna
  const handleResolve = async (ticketId) => {
    // 1. Alert box dikhao (Are you sure?)
    const isConfirmed = window.confirm("Are you sure you want to resolve this ticket? It will be cleared from this list.")
    
    // 2. Agar user Cancel pe click kare, toh function yahin rok do (kuch mat karo)
    if (!isConfirmed) {
      return
    }

    // 3. Agar OK pe click kare, toh backend ko request bhejo
    try {
      const response = await fetch(`${API_URL}/${ticketId}/resolve`, {
        method: 'PATCH',
      })

      if (!response.ok) throw new Error('Failed to resolve ticket')
      
      // List ko refresh karo (ticket gayab ho jayegi aur stats update ho jayenge)
      fetchTickets()
    } catch (err) {
      alert("Error resolving ticket: " + err.message)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'red';
      case 'NORMAL': return 'orange';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Smart Triage 🎫</h1>
        <div>
          <button 
            onClick={() => setCurrentView('customer')}
            style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer', backgroundColor: currentView === 'customer' ? '#007bff' : '#eee', color: currentView === 'customer' ? 'white' : 'black', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Customer Portal
          </button>
          <button 
            onClick={() => setCurrentView('admin')}
            style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: currentView === 'admin' ? '#333' : '#eee', color: currentView === 'admin' ? 'white' : 'black', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Admin Dashboard
          </button>
        </div>
      </div>

      {error && <div style={{ backgroundColor: '#ffebee', color: 'red', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}><strong>Error: </strong> {error}</div>}
      
      {currentView === 'customer' && (
        <div style={{ border: '1px solid #ddd', padding: '30px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2>Submit a Support Request</h2>
          {successMsg && <div style={{ backgroundColor: '#e8f5e9', color: 'green', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{successMsg}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <textarea 
              rows="5"
              placeholder="E.g., The payment page is crashing and giving a 500 error..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              style={{ padding: '15px', width: '100%', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#000', fontSize: '16px' }}
            />
            <button type="submit" disabled={loading} style={{ padding: '12px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      {currentView === 'admin' && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Admin Dashboard</h2>
            
            {/* NAYA FEATURE: Stats dikhane wala UI */}
            <div style={{ display: 'flex', gap: '15px', fontWeight: 'bold' }}>
               <span style={{ color: 'red' }}>Unresolved: {stats.unresolved}</span>
               <span style={{ color: 'green' }}>Resolved: {stats.resolved}</span>
            </div>

            <button onClick={fetchTickets} style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>🔄 Refresh</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '20px', border: '1px solid #eee' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>ID</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Message</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Category</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Priority</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No unresolved tickets right now! 🎉</td></tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', color: '#666' }}>#{ticket.id}</td>
                    <td style={{ padding: '12px', maxWidth: '300px' }}>{ticket.customer_message}</td>
                    <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#e9ecef', padding: '4px 8px', borderRadius: '4px', fontSize: '14px' }}>{ticket.category}</span></td>
                    <td style={{ padding: '12px', color: getPriorityColor(ticket.priority), fontWeight: 'bold' }}>{ticket.priority}</td>
                    
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => handleResolve(ticket.id)}
                        style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✅ Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App