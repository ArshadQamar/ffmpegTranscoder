'use client';
import { useState } from 'react';

export default function CreateChannel() {
  const [name, setName] = useState('');
  const [inputType, setInputType] = useState('');
  const [outputType, setOutputType] = useState('');
  const [network, setNetwork] = useState([
    { name: 'eth0' },
    { name: 'wlan0' },
    { name: 'lo' },
  ])
  const [selectedInputNetwork, setSelectedInputNetwork] = useState('');
  const [selectedOutputNetwork, setSelectedOutputNetwork] = useState('');

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📺 Create New Channel</h1>

      <form className="space-y-4">
        {/* Channel Name */}
        <div>
          <label className="block font-semibold mb-1">Channel Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter channel name"
          />
        </div>

        {/* Input Type */}
        <div>
          <label className="block font-semibold mb-1">Input Type:</label>
          <select
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Input Type --</option>
            <option value="hls">HLS</option>
            <option value="udp">UDP</option>
            <option value="file">File</option>
          </select>
        </div>

        {/* Placeholder for conditional input fields */}
        <div className="mt-4">
          {inputType === 'hls' && (
            <div>
              <label className="block font-semibold mb-1">Input URL:</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="http://example.com/stream.m3u8"
              />
            </div>
          )}

          {inputType === 'udp' && (
            <div>
              <label className="block font-semibold mb-1">Multicast IP:</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="239.0.0.1:5000"

              />
              <label className="block font-semibold mb-1">Network Interface:</label>
              <select
                value={selectedInputNetwork}
                onChange={(e) => setSelectedInputNetwork(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Network Interface --</option>
                {network.map((iface, index) => (
                  <option key={index} value={iface.name}>
                    {iface.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {inputType === 'file' && (
            <div>
              <label className="block font-semibold mb-1">Upload File:</label>
              <input type="file" className="w-full p-2 border rounded" />
            </div>
          )}
        </div>
        {/* Output Type */}
        <div className="mt-6">
          <label className="block font-semibold mb-1">Output Type:</label>
          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Output Type --</option>
            <option value="hls">HLS</option>
            <option value="udp">UDP</option>
            <option value="file">File</option>
          </select>
        </div>

        {/* Output Fields */}
        {outputType === 'udp' && (
          <div className="mt-4">
            <label className="block font-semibold mb-1">Output Multicast IP:</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="239.0.0.2:6000"
            />
            <label className="block font-semibold mb-1 mt-2">Output Network Interface:</label>
            <select
              value={selectedOutputNetwork}
              onChange={(e) => setSelectedOutputNetwork(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Network Interface --</option>
              {network.map((iface, index) => (
                <option key={index} value={iface.name}>
                  {iface.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded mt-6"
        >
          Create Channel
        </button>
      </form>
    </main>
  );
}