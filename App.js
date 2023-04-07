import React, { useState, useEffect } from "react";
import "./App.css";
import * as XLSX from 'xlsx';


function exportToExcel(pingResults) {
  /* convert successful pings data to worksheet */
  const wsSuccess = XLSX.utils.json_to_sheet(
    pingResults.successfulPings.map((ping) => ({
      IP: ping.ip,
      Status: ping.output.includes("host unreachable") ? "unreachable" : "success",
      Result: "Success - " + ping.output,
    }))
  );

  /* convert unsuccessful pings data to worksheet */
  const wsFailure = XLSX.utils.json_to_sheet(
    pingResults.unsuccessfulPings.map((ping) => ({
      IP: ping.ip,
      Status: ping.error,
      Result: "Failed - " + ping.output,
    }))
  );

  /* generate workbook and add the worksheets */
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSuccess, "Successful Pings");
  XLSX.utils.book_append_sheet(wb, wsFailure, "Unsuccessful Pings");

  /* save to file */
  try {
    XLSX.writeFile(wb, "ping_results.xlsx");
  } catch (error) {
    console.error(`Error saving file: ${error}`);
  }
}


function App() {
  const [systemInfo, setSystemInfo] = useState({});
  const [networkInfo, setNetworkInfo] = useState({});
  const [pingResults, setPingResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemResponse, networkResponse, pingResponse] = await Promise.all([
          fetch("http://localhost:5000/api/system-info"),
          fetch("http://localhost:5000/api/network-info"),
          fetch("http://localhost:5000/api/ping")
        ]);

        if (!systemResponse.ok || !networkResponse.ok || !pingResponse.ok) {
          throw new Error("Network response was not ok");
        }

        const systemData = await systemResponse.json();
        const networkData = await networkResponse.json();
        const pingData = await pingResponse.json();

        setSystemInfo({
          brand: systemData.brand,
          model: systemData.model,
          ramType: systemData.ramType,
          ramSize: systemData.ramSize,
          ramUsage: systemData.ramUsage,
          totalStorage: systemData.totalStorage,
          freeStorage: systemData.freeStorage,
          usedStorage: systemData.usedStorage,
          processorModel: systemData.processorModel,
          processorSpeed: systemData.processorSpeed,
          osName: systemData.osName,
          osVersion: systemData.osVersion,
          cpuUsage: systemData.cpuUsage,
        });

        setNetworkInfo({
          ipAddress: networkData.ipAddress,
          subnetMask: networkData.subnetMask,
          gateway: networkData.gateway,
          pingResult: networkData.pingResult,
        });

        setPingResults(pingData);
      } catch (error) {
        console.error(`Error fetching info: ${error}`);
      }
    };

    fetchData();
  }, []);

  // This function will be called when Export to Excel button is clicked
  const handleExportButtonClick = () => {
    exportToExcel(pingResults)
  }

  return (
    <div class="table-container">
 <table>
      <thead>
        <tr>
          <th colspan="2">
            System Information
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Brand:</td>
          <td>{systemInfo.brand}</td>
        </tr>
        <tr>
          <td>Model:</td>
          <td>{systemInfo.model}</td>
        </tr>
        <tr>
          <td>RAM Type:</td>
          <td>{systemInfo.ramType}</td>
        </tr>
        <tr>
          <td>RAM Size:</td>
          <td>{systemInfo.ramSize}</td>
        </tr>
        <tr>
          <td>RAM Usage:</td>
          <td>{systemInfo.ramUsage}</td>
        </tr>
        <tr>
          <td>Total Storage:</td>
          <td>{systemInfo.totalStorage}</td>
        </tr>
        <tr>
          <td>Free Storage:</td>
          <td>{systemInfo.freeStorage}</td>
        </tr>
        <tr>
          <td>Used Storage:</td>
          <td>{systemInfo.usedStorage}</td>
        </tr>
        <tr>
          <td>Processor Model:</td>
          <td>{systemInfo.processorModel}</td>
        </tr>
        <tr>
          <td>Processor Speed:</td>
          <td>{systemInfo.processorSpeed}</td>
        </tr>
        <tr>
          <td>OS Name:</td>
          <td>{systemInfo.osName}</td>
        </tr>
        <tr>
          <td>OS Version:</td>
          <td>{systemInfo.osVersion}</td>
        </tr>
        <tr>
          <td>CPU Usage:</td>
          <td>{systemInfo.cpuUsage}</td>
        </tr>
      </tbody>
    </table>

    <table>
      <thead>
        <tr>
          <th colspan="2">
            Network Information
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>IP Address:</td>
          <td>{networkInfo.ipAddress}</td>
        </tr>
        <tr>
          <td>Subnet Mask:</td>
          <td>{networkInfo.subnetMask}</td>
        </tr>
        <tr>
          <td>Gateway:</td>
          <td>{networkInfo.gateway}</td>
        </tr>
        <tr>
          <td>Ping Result:</td>
          <td>{networkInfo.pingResult}</td>
        </tr>
      </tbody>
    </table>
      
    <tr>
  <td class="successful-pings">
    <table>
      <thead>
        <tr>
          <th colspan="2" class="heading">Successful Pings</th>
        </tr>
      </thead>
      <tbody>
      {pingResults.successfulPings && pingResults.successfulPings.length > 0 &&
  pingResults.successfulPings.map((ping, index) => (
    <tr key={"success-" + index}>
      <td>{ping.ip}:</td>
      <td className={ping.output.includes("host unreachable") ? "unreachable":"success"}>Success - {ping.output}</td>
    </tr>
  ))
}
      </tbody>
    </table>
  </td>

  <td class="unsuccessful-pings">
    <table>
      <thead>
        <tr>
          <th colspan="2" class="heading">Unsuccessful Pings</th>
        </tr>
      </thead>
      <tbody>
      {pingResults.unsuccessfulPings && pingResults.unsuccessfulPings.length > 0 &&
  pingResults.unsuccessfulPings.map((ping, index) => (
    <tr key={"fail-" + index}>
      <td>{ping.ip}:</td>
      <td className="fail">{`Failed - ${ping.error}`}</td>
    </tr>
  ))
}
<br></br>
{/* Add Export to Excel button */}
<center><button onClick={handleExportButtonClick}>Export to Excel(successfulPings & unsuccessfulPings & Results)</button></center>
      </tbody>
    </table>
  </td>
</tr>
    </div>
  );
}

export default App;



