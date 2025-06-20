'use client'; // Enables client-side interactivity
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Dashboard() {
 // Environment variable
 const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;


  // State to hold channels
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter(); // initialize router


  // Fetch channel list from API on component mount
  useEffect(() => {
    axios.get(`${apiUrl}/channels/`)
      .then(response => {
        setChannels(response.data); // Store data in state
        setLoading(false);          // Stop loading spinner
      })
      .catch(error => {
        console.error('Error fetching channels:', error);
        setError('Failed to fetch channels check backend service');
        setLoading(false);
      });
  }, []);

  // Handle start
  const handleStart = async (jobID) =>{
    console.log(`starting channel with id ${jobID}`);
    try{
      //start the job
      await axios.post(`${apiUrl}/job/${jobID}/start/`)

      //Refetch Updated channel from backend
      const response = await axios.get(`${apiUrl}/channels`)

      // updating state for UI re render
      setChannels(response.data);
    }catch(error){
      alert('Error starting job:',error)
    }

        
  }
  //Handle stop
  const handleStop = async (jobID)=>{
    try{
      //stop the job
      await axios.post(`${apiUrl}job/${jobID}/stop/`)

      //refetch the status
      const response = await axios.get(`${apiUrl}/channels`)

      //UI re-render
      setChannels(response.data)
    }catch(error){
      alert('Error stopping job', error)
    }
  }

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">📡 Channel Dashboard</h1>
        <button 
        className="bg-orange-400 text-white px-2 py-1 rounded hover:bg-green-700"
        onClick={()=>{router.push('/addChannel')}}>
          + Channel
        </button>
      </div>
      {/* Show loading state */}
      {loading ? <p>Loading...</p> : 
      error ? <p className="text-red-500">Error: {error}</p> :(
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Name</th>
              <th className="border border-gray-300 px-4 py-2">Input Type</th>
              <th className="border border-gray-300 px-4 py-2">Status</th>
              <th className="border border-gray-300 px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {channels.map(channel => (
              <tr key={channel.id}>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">{channel.id}</td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">{channel.name}</td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">{channel.input_type}</td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">{channel.status}</td>
                <td className="border border-gray-300 px-4 py-1 text-center align-middle">
                  {
                    channel.status == "running" ?(
                      <button className="bg-red-500 text-white py-1 px-3 rounded hover:bg-green-500"
                      onClick={()=>handleStop(channel.job_id)}
                      > Stop
                      </button>
                    ): <button className="bg-green-500 text-white py-1 px-3 rounded hover:bg-red-500"
                    onClick={()=>{handleStart(channel.job_id)}}>
                      Start
                    </button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
