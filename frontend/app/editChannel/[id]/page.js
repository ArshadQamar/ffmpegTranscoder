'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';

export default function EditChannel() {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
  const params = useParams();
  const channelId = params?.id;

  const [loading, setLoading] = useState(true);

  // Channel Details
  const [name, setName] = useState('');
  const [inputType, setInputType] = useState('');
  const [input, setInput] = useState('');
  const [outputType, setOutputType] = useState('');
  const [output, setOutput] = useState('');
  const [network, setNetwork] = useState([]);
  const [selectedInputNetwork, setSelectedInputNetwork] = useState('');
  const [selectedOutputNetwork, setSelectedOutputNetwork] = useState('');

  // Transcoding Param
  const [videoCodec, setVideoCodec] = useState('');
  const [audioCodec, setAudioCodec] = useState('');
  const [audioGain, setAudioGain] = useState('');
  const [videoBitrate, setVideoBitrate] = useState('');
  const [audioBitrate, setAudioBitrate] = useState('');
  const [bufferSize, setBufferSize] = useState('');
  const [resolution, setResolution] = useState('');
  const [frameRate, setFrameRate] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [logoPosition, setLogoPosition] = useState('');
  const [serviceId, setServiceId] = useState('');

  useEffect(() => {
    if (!channelId) return;

    // Fetch channel details
    axios.get(`${apiUrl}/channels/${channelId}/`)
      .then((res) => {
        const data = res.data;
        setName(data.name);
        setInputType(data.input_type);
        setOutputType(data.output_type);
        setInput(data.input_url || data.input_multicast_ip || data.input_file || '');
        setOutput(data.output_url || data.output_multicast_ip || data.output_file || '');
        setSelectedInputNetwork(data.input_network || '');
        setSelectedOutputNetwork(data.output_network || '');
        setVideoCodec(data.video_codec);
        setAudioCodec(data.audio);
        setAudioGain(data.audio_gain);
        setVideoBitrate(data.video_bitrate);
        setAudioBitrate(data.audio_bitrate);
        setBufferSize(data.buffer_size);
        setServiceId(data.service_id);
        setResolution(data.resolution);
        setFrameRate(data.frame_rate);
        setLogoPath(data.logo_path);
        setLogoPosition(data.logo_position);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch channel details', err);
        setLoading(false);
      });

    // Fetch network interfaces
    axios.get(`${apiUrl}/netiface/`)
      .then((res) => setNetwork(res.data))
      .catch((err) => console.error('Failed to fetch network interfaces', err));
  }, [channelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      input_type: inputType,
      input_url: inputType === 'hls' ? input : null,
      input_multicast_ip: inputType === 'udp' ? input : null,
      input_network: inputType === 'udp' ? selectedInputNetwork : null,
      input_file: inputType === 'file' ? input : null,

      output_type: outputType,
      output_url: outputType === 'hls' ? output : null,
      output_multicast_ip: outputType === 'udp' ? output : null,
      output_network: outputType === 'udp' ? selectedOutputNetwork : null,
      output_file: outputType === 'file' ? output : null,

      video_codec: videoCodec,
      audio: audioCodec,
      audio_gain: parseFloat(audioGain) || 1.0,
      video_bitrate: parseInt(videoBitrate) || 0,
      audio_bitrate: parseInt(audioBitrate) || 0,
      buffer_size: parseInt(bufferSize) || 0,
      service_id: parseInt(serviceId),
      resolution,
      frame_rate: parseInt(frameRate) || 0,

      logo_path: logoPath || null,
      logo_position: logoPosition || null,
    };

    try {
      console.log('Payload:', payload);
      const res = await axios.put(`${apiUrl}/channels/${channelId}/`, payload);
      if (res.status === 200) {
        alert('Channel updated successfully!');
      } else {
        alert(`Unexpected response: ${res.status}`);
      }
    } catch (err) {
      alert(`Failed to update channel: ${err.response?.data?.detail || err.message}`);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📝 Edit Channel</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Same UI structure as CreateChannel, adapted to use the state values */}
        {/* Channel Name */}
        <div>
          <label className="block font-semibold mb-1">Channel Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
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

        {/* Input Config */}
        {inputType === 'hls' && (
          <div>
            <label className="block font-semibold mb-1">Input URL:</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {inputType === 'udp' && (
          <>
            <label className="block font-semibold mb-1">Multicast IP:</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <label className="block font-semibold mb-1">Input Network:</label>
            <select
              value={selectedInputNetwork}
              onChange={(e) => setSelectedInputNetwork(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Network --</option>
              {network.map((iface, i) => (
                <option key={i} value={iface.ip_addresses}>
                  {iface.name} {iface.ip_addresses}
                </option>
              ))}
            </select>
          </>
        )}

        {inputType === 'file' && (
          <div>
            <label className="block font-semibold mb-1">Input File:</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {/* Output Type */}
        <div>
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

        {/* Output Config */}
        {outputType === 'hls' && (
          <div>
            <label className="block font-semibold mb-1">Output URL:</label>
            <input
              type="text"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {outputType === 'udp' && (
          <>
            <label className="block font-semibold mb-1">Multicast IP:</label>
            <input
              type="text"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <label className="block font-semibold mb-1">Output Network:</label>
            <select
              value={selectedOutputNetwork}
              onChange={(e) => setSelectedOutputNetwork(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Network --</option>
              {network.map((iface, i) => (
                <option key={i} value={iface.ip_addresses}>
                  {iface.name} {iface.ip_addresses}
                </option>
              ))}
            </select>
          </>
        )}

        {outputType === 'file' && (
          <div>
            <label className="block font-semibold mb-1">Output File:</label>
            <input
              type="text"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {/* Transcoding Settings */}
        <h2 className="text-xl font-semibold mt-8 mb-4">🎛️ Transcoding Parameters</h2>

        {/* Reuse the same structure as before */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Video Codec:</label>
            <select
              value={videoCodec}
              onChange={(e) => setVideoCodec(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select --</option>
              <option value="h264">H.264</option>
              <option value="h265">H.265</option>
              <option value="mpeg2">MPEG-2</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Audio Codec:</label>
            <select
              value={audioCodec}
              onChange={(e) => setAudioCodec(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select --</option>
              <option value="aac">AAC</option>
              <option value="ac3">AC3</option>
              <option value="mp2">MP2</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Audio Gain:</label>
            <input
              type="number"
              step="0.1"
              value={audioGain}
              onChange={(e) => setAudioGain(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 1.0"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Video Bitrate:</label>
            <input
              type="number"
              value={videoBitrate}
              onChange={(e) => setVideoBitrate(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="bps"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Audio Bitrate:</label>
            <input
              type="number"
              value={audioBitrate}
              onChange={(e) => setAudioBitrate(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="bps"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Buffer Size:</label>
            <input
              type="number"
              value={bufferSize}
              onChange={(e) => setBufferSize(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="bits"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Service ID:</label>
            <input
              type="number"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Resolution:</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select --</option>
              <option value="1920x1080">1920x1080</option>
              <option value="1280x720">1280x720</option>
              <option value="1024x576">1024x576</option>
              <option value="768x576">768x576</option>
              <option value="854x480">854x480</option>
              <option value="640x360">640x360</option>
              <option value="426x240">426x240</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Frame Rate:</label>
            <select
              value={frameRate}
              onChange={(e) => setFrameRate(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select --</option>
              <option value="24">24</option>
              <option value="25">25</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="60">60</option>
            </select>
          </div>
        </div>

        {/* Logo */}
        <h2 className="text-xl font-semibold mt-8 mb-4">🖼️ Logo Overlay</h2>

        <div>
          <label className="block font-semibold mb-1">Logo Path:</label>
          <input
            type="text"
            value={logoPath}
            onChange={(e) => setLogoPath(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g. /logos/channel-logo.png"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Logo Position:</label>
          <select
            value={logoPosition}
            onChange={(e) => setLogoPosition(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Position --</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded mt-6"
        >
          Update Channel
        </button>
      </form>
    </main>
  );
}
