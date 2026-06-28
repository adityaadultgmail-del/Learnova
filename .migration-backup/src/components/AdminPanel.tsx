import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { Check, X, Loader2 } from 'lucide-react';

export function AdminPanel() {
  const { user, userData, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.role === 'admin') {
      const fetchRequests = async () => {
        try {
          const q = query(collection(db, 'premiumRequests'), where('status', '==', 'pending'));
          const snap = await getDocs(q);
          setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
          console.error("Error fetching requests:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [userData]);

  const handleApprove = async (reqId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'premiumRequests', reqId), { status: 'approved' });
      await updateDoc(doc(db, 'users', userId), { premiumStatus: 'approved' });
      setRequests(requests.filter(r => r.id !== reqId));
    } catch (error) {
      console.error(error);
      alert("Failed to approve request");
    }
  };

  const handleReject = async (reqId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'premiumRequests', reqId), { status: 'rejected' });
      await updateDoc(doc(db, 'users', userId), { premiumStatus: 'none' });
      setRequests(requests.filter(r => r.id !== reqId));
    } catch (error) {
      console.error(error);
      alert("Failed to reject request");
    }
  };

  if (authLoading || loading) return <div className="p-12 text-center text-slate-500">Loading admin panel...</div>;
  if (userData?.role !== 'admin') return <div className="p-12 text-center font-bold text-red-500">Access Denied. Admins only.</div>;

  return (
    <div className="bg-white/50 backdrop-blur-md rounded-3xl p-8 max-w-4xl mx-auto mt-8 border border-white shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Admin Panel - Premium Requests</h2>
      
      {requests.length === 0 ? (
        <p className="text-slate-600 text-center py-8">No pending requests at the moment.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-slate-100">
              <div>
                <p className="font-bold text-slate-800">{req.userEmail}</p>
                <p className="text-xs text-slate-500">User ID: {req.userId}</p>
                <p className="text-xs text-slate-400 mt-1">Requested at: {new Date(req.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleReject(req.id, req.userId)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-5 h-5" /> Reject
                </button>
                <button 
                  onClick={() => handleApprove(req.id, req.userId)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1 font-medium"
                >
                  <Check className="w-5 h-5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

