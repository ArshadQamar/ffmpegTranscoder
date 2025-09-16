'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';


export default function CreateChannel() {
  // Environment variables
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;
  
  // for page routing
  const router = useRouter();

  // Channel Details
  const [name, setName] = useState('');
  const [inputType, setInputType] = useState('');
  const [input, setInput] = useState('')
  const [outputType, setOutputType] = useState('');
  const [output, setOutput] = useState('')
  const [network, setNetwork] = useState([])
  const [selectedInputNetwork, setSelectedInputNetwork] = useState('');
  const [selectedOutputNetwork, setSelectedOutputNetwork] = useState('');

  // Transcoding Param
  const [videoCodec, setVideoCodec] = useState('');
  const [audioCodec, setAudioCodec] = useState('');
  const [audioGain, setAudioGain] = useState('');
  const [bitrateMode, setBitrateMode] = useState('');
  const [videoBitrate, setVideoBitrate] = useState('');
  const [audioBitrate, setAudioBitrate] = useState('');
  const [bufferSize, setBufferSize] = useState('');
  const [resolution, setResolution] = useState('');
  const [frameRate, setFrameRate] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [logoPosition, setLogoPosition] = useState('');
  const [logoOpacity, setLogoOpacity] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [videoPid, setVideoPid] = useState('');
  const [audioPid, setAudioPid] = useState('');
  const [pmtPid, setPmtPid] = useState('');
  const [pcrPid, setPcrPid] = useState('');
  const [scanType, setScanType] = useState('');
  const [aspectRatio, setAspectRatio] = useState('');

  //json file
  let [importedFileName, setImportedFileName] = useState(null);

  

  useEffect(() => {
    // Fetch network interfaces from API
    axios.get(`${apiUrl}/netiface`)
      .then(response => {
        setNetwork(response.data); // Set the fetched network interfaces in state
        console.log(response.data)
      })
      .catch(error => {
        console.error('Error fetching network interfaces:', error);
      });
  }, []);

  //Validating JSON

  const validateChannelJson = (data)=>{
    const REQUIRED_FIELDS = [
      "name", "input_type", "output_type", "input_multicast_ip", "output_multicast_ip",
      "input_network", "output_network", "video_codec", "audio", "audio_gain",
      "bitrate_mode", "video_bitrate", "audio_bitrate", "buffer_size", "resolution",
      "frame_rate", "service_id", "video_pid", "audio_pid", "pmt_pid", "pcr_pid",
      "scan_type", "aspect_ratio", "logo_path", "logo_position", "logo_opacity", 
      "id", "status", "job_id", "input_url", "input_file", "output_url", "output_file"
    ];
    //check missing fields
    const missing = REQUIRED_FIELDS.filter(f => !(f in data))
    if (missing.length > 0){
      return `Missing required fields: ${missing.join(", ")}`
    }
    // extra fields
    const extra = Object.keys(data).filter(f=>!(REQUIRED_FIELDS.includes(f)));
    if (extra.length > 0){
      return `Unexpected fields found: ${extra.join(", ")}`;
    }
  }

  //Handle JSON upload
  
  const handleFileUpload = (e) =>{
    const file = e.target.files[0]
    if (!file) {
      console.error("No valid file not found")
      return
    }
    
    const reader = new FileReader();
    reader.onload = (event)=>{
      try{
        const data = JSON.parse(event.target.result)
        const validationError = validateChannelJson(data)
        if (validationError){
          alert("Invalid JSON: " + validationError);
          return
        }
        setImportedFileName(file.name)
        console.log(data)
        // Fill state with JSON values
        setName(data.name || "");
        setInputType(data.input_type || "");
        setInput(data.input_url || data.input_multicast_ip || data.input_file || "");
        setSelectedInputNetwork(data.input_network || "");
        setOutputType(data.output_type || "");
        setOutput(data.output_url || data.output_multicast_ip || data.output_file || "");
        setSelectedOutputNetwork(data.output_network || "");
        setVideoCodec(data.video_codec || "");
        setAudioCodec(data.audio || "");
        setAudioGain(data.audio_gain?.toString() || "");
        setBitrateMode(data.bitrate_mode || "");
        setVideoBitrate(data.video_bitrate?.toString() || "");
        setAudioBitrate(data.audio_bitrate?.toString() || "");
        setBufferSize(data.buffer_size?.toString() || "");
        setResolution(data.resolution || "");
        setFrameRate(data.frame_rate?.toString() || "");
        setServiceId(data.service_id?.toString() || "");
        setVideoPid(data.video_pid?.toString() || "");
        setAudioPid(data.audio_pid?.toString() || "");
        setPmtPid(data.pmt_pid?.toString() || "");
        setPcrPid(data.pcr_pid?.toString() || "");
        setScanType(data.scan_type || "");
        setAspectRatio(data.aspect_ratio || "");
        setLogoPath(data.logo_path || "");
        setLogoPosition(data.logo_position || "");
        setLogoOpacity(data.logo_opacity?.toString() || "");

      }catch(error){
        alert("Invalid JSON File")
        console.error("error parsing JSON", error)
      }
    }
    reader.readAsText(file);
  }

  //Handling submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('submit clicked')
    
    const payload = {
      name,
      input_type: inputType,
      input_url: inputType === 'hls' ? input: null,
      input_multicast_ip: inputType === 'udp' ? input: null,
      input_network: inputType === 'udp' ? selectedInputNetwork: null,
      input_file: inputType === 'file' ? input : null,

      output_type: outputType,
      output_url: outputType === 'hls' ? output : null,
      output_multicast_ip: outputType === 'udp' ? output : null,
      output_network: outputType === 'udp' ? selectedOutputNetwork : null,
      output_file: outputType === 'file' ? output : null,      

      video_codec: videoCodec,
      audio: audioCodec,
      audio_gain: parseFloat(audioGain) || 1.0,
      bitrate_mode: bitrateMode,
      video_bitrate: parseInt(videoBitrate) || 0,
      audio_bitrate: parseInt(audioBitrate) || 0,
      buffer_size: parseInt(bufferSize) || 0,
      service_id: parseInt(serviceId),
      audio_pid: parseInt(audioPid),
      video_pid: parseInt(videoPid),
      pmt_pid: parseInt(pmtPid), 
      pcr_pid: parseInt(pcrPid),
      resolution,
      scan_type: scanType,
      aspect_ratio: aspectRatio,
      frame_rate: parseInt(frameRate) || 0,

      logo_path: logoPath || null,
      logo_position: logoPosition || null,
      logo_opacity: parseFloat(logoOpacity) || null,
    };

    try{
      const response = await axios.post(`${apiUrl}/channels/`, payload);
      console.log(response.data)
      if(response.status === 201 || response.status === 200){
        alert(`channel created succesfully`);
        router.push('/')
      }else{
        alert(`unexpected response ${responsestatus}`);
      }

    }catch(error){
      alert(`Failed to create channel. Error: ${error.response?.data?.detail || error.message}`);
    }
    
    
  }


  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-6">Create New Channel</h1>
        <div className='flex gap-2'>
         <input
          type='file'
          id="json-upload"
          accept='application/json'
          onChange={handleFileUpload}
          className="hidden"
         />
          <label
          htmlFor="json-upload"
          className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
          Import JSON
          </label>
            {/* Show file name */}
            {importedFileName && (
              <span className="text-gray-700 text-sm">{importedFileName}</span>
            )}

        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
                value={input}
                type="text"
                className="w-full p-2 border rounded"
                placeholder="http://example.com/stream.m3u8"
                onChange={(e)=>setInput(e.target.value)}
              />
            </div>
          )}

          {inputType === 'udp' && (
            <div>
              <label className="block font-semibold mb-1">Multicast IP:</label>
              <input
                value={input}
                type="text"
                className="w-full p-2 border rounded"
                placeholder="239.0.0.1:5000"
                onChange={(e)=>setInput(e.target.value)}

              />
              <label className="block font-semibold mb-1">Network Interface:</label>
              <select
                value={selectedInputNetwork}
                onChange={(e) => setSelectedInputNetwork(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Network Interface --</option>
                {network.map((iface, index) => (
                  <option key={index} value={iface.ip_addresses}>
                    {iface.name} {iface.ip_addresses}
                  </option>
                ))}
              </select>
            </div>
          )}

          {inputType === 'file' && (
            <div>
              
              <label className="block font-semibold mb-1">Upload File:</label>
              <input 
              value={input}
              type="text" 
              className="w-full p-2 border rounded" 
              onChange={(e)=>setInput(e.target.value)}
              placeholder='/file/path/video.mp4'
              />
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
              value={output}
              type="text"
              className="w-full p-2 border rounded"
              placeholder="239.0.0.2:6000"
              onChange={(e)=>setOutput(e.target.value)}
            />
            <label className="block font-semibold mb-1 mt-2">Output Network Interface:</label>
            <select
              value={selectedOutputNetwork}
              onChange={(e) => setSelectedOutputNetwork(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Network Interface --</option>
              {network.map((iface, index) => (
                <option key={index} value={iface.ip_addresses}>
                  {iface.name} {iface.ip_addresses}
                </option>
              ))}
            </select>
          </div>
        )}
          {outputType === 'hls' && (
            <div>
              <label className="block font-semibold mb-1">Input URL:</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="http://example.com/stream.m3u8"
                onChange={(e)=>setOutput(e.target.value)}
              />
            </div>
          )}

          {outputType === 'file' && (
            <div>
              <label className="block font-semibold mb-1">Upload File:</label>
              <input 
              type="text" 
              className="w-full p-2 border rounded"
              onChange={(e)=>setOutput(e.target.value)}
              placeholder='/file/path/name.mp4'
              />
            </div>
          )}

        {/* Transcoding Parameters */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">🎛️ Transcoding Parameters</h2>

          {/* Video Codec */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Video Codec:</label>
            <select
              value={videoCodec}
              onChange={(e) => setVideoCodec(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Video Codec --</option>
              <option value="libx264">H.264</option>
              <option value="libx265">H.265</option>
              <option value="mpeg2video">MPEG-2</option>
            </select>
          </div>

          {/* Audio Codec */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Audio Codec:</label>
            <select
              value={audioCodec}
              onChange={(e) => setAudioCodec(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Audio Codec --</option>
              <option value="aac">AAC</option>
              <option value="ac3">AC3</option>
              <option value="mp2">MP2</option>
            </select>
          </div>

          {/* Audio Gain */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Audio Gain:</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              step="0.1"
              value={audioGain}
              onChange={(e) => setAudioGain(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 1.0, 0.1(-90)"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Bitrate Mode:</label>
            <select
              value={bitrateMode}
              onChange={(e) => setBitrateMode(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Bitrate Mode --</option>
              <option value="cbr">CBR</option>
              <option value="vbr">VBR</option>
            </select>
          </div>

          {/* Video Bitrate */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Video Bitrate (bps):</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              value={videoBitrate}
              onChange={(e) => setVideoBitrate(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 2400000"
            />
          </div>

          {/* Audio Bitrate */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Audio Bitrate (bps):</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              value={audioBitrate}
              onChange={(e) => setAudioBitrate(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 128000"
            />
          </div>

          {/* Buffer Size */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Buffer Size (bits):</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              value={bufferSize}
              onChange={(e) => setBufferSize(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. 4800000"
            />
          </div>

          {/* Service ID */}
          <div className='mb-4'>
            <label className="block font-semibold mb-1">SID</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              value={serviceId}
              onChange={(e)=>setServiceId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder='(1-9999)'
            />
          </div>
          {/* Video PID */}
          <div className='mb-4'>
            <label className="block font-semibold mb-1">Video PID</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              value={videoPid}
              onChange={(e)=>setVideoPid(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder='(1-9999)'
            />
          </div>
          {/* Audio PID */}
          <div className='mb-4'>
            <label className="block font-semibold mb-1">Audio PID</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              value={audioPid}
              onChange={(e)=>setAudioPid(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder='(1-9999)'
            />
          </div>
          <div className='mb-4'>
            <label className="block font-semibold mb-1">PMT PID</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              value={pmtPid}
              onChange={(e)=>setPmtPid(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder='(1-9999)'
            />
          </div>
          <div className='mb-4'>
            <label className="block font-semibold mb-1">PCR PID</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              value={pcrPid}
              onChange={(e)=>setPcrPid(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder='(1-9999)'
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Scan Type:</label>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Scan type --</option>
              <option value="progressive">Progressive</option>
              <option value="interlaced">Interlaced</option>
            </select>
          </div>

          {/* Resolution */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Resolution:</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Resolution --</option>
              <option value="1920x1080">1920x1080</option>
              <option value="1280x720">1280x720</option>
              <option value="1024x576">1024x576</option>
              <option value="768x576">768x576</option>
              <option value="854x480">854x480</option>
              <option value="640x360">640x360</option>
              <option value="426x240">426x240</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Aspect Ratio:</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Aspect Ratio --</option>
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
            </select>
          </div>

          {/* Frame Rate */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Frame Rate (fps):</label>
            <select
              value={frameRate}
              onChange={(e) => setFrameRate(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Frame Rate --</option>
              <option value="24">24</option>
              <option value="25">25</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="60">60</option>
            </select>
          </div>

          {/* Logo Overlay */}
          <h2 className="text-xl font-semibold mb-4 mt-8">Logo Overlay</h2>

          {/* Logo Path */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Logo Path:</label>
            <input
              type="text"
              value={logoPath}
              onChange={(e) => setLogoPath(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g. /logos/channel-logo.png"
            />
          </div>

          {/* Logo Position */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Logo Position (FFmpeg overlay):</label>
            <input
              type="text"
              value={logoPosition}
              onChange={(e) => setLogoPosition(e.target.value)}
              placeholder="e.g., x=10:y=10 or x=W-w-10:y=H-h-10"
              className="w-full p-2 border rounded"
            />
            <p className="text-sm text-gray-500 mt-1">
              Format: <code>x=10:y=10</code> or <code>x=W-w-10:y=H-h-10</code>
            </p>
          </div>

          {/* logo opacity */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Logo Opacity:</label>
            <input
              type="number"
              onWheel={e => e.target.blur()}
              min="0.0"
              max="1.0"
              step="0.01"
              value={logoOpacity}
              onChange={(e) => setLogoOpacity(e.target.value)}
              placeholder="Enter a value between 0.0 and 1.0"
              className="w-full p-2 border rounded"
              title="Opacity must be between 0.0 and 1.0"
            />
            {(logoOpacity !== '' && (parseFloat(logoOpacity) < 0 || parseFloat(logoOpacity) > 1)) && (
            <p className="text-red-500 text-sm mt-1">Opacity must be between 0.0 and 1.0</p>
            )}

          </div>
            {/* Cross-field Validation: Show if only some fields are filled */}
              {((logoPath || logoPosition || logoOpacity) &&
                (!logoPath || !logoPosition || !logoOpacity)) && (
                <p className="text-red-500 text-sm mb-4">
                  Please fill in all logo fields: Path, Position, and Opacity.
                </p>
            )}

        </div>

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