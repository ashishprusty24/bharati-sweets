import React, { useState } from "react";
import { Button, Modal, DatePicker, Table, Space, message } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { API_BASE_URL } from "../../../common/config";

dayjs.extend(utc);

const PreparationReportModal = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // fetch report from backend
  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/event-orders/preparation-report?date=${selectedDate.format(
          "YYYY-MM-DD"
        )}`
      );
      const data = await res.json();
      setReport(data || []);
    } catch (err) {
      message.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  // export to CSV
  const exportCSV = () => {
    if (!report.length) {
      message.warning("No data to export");
      return;
    }

    const items = report[0].items || [];
    const header = ["Name,Quantity"];
    const rows = items.map((i) => `${i.name},${i.quantity}`);
    const csv = [...header, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preparation-report-${selectedDate.format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
    },
  ];

  return (
    <>
      <Button type="dashed" onClick={() => setVisible(true)}>
        Open Preparation Report
      </Button>

      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        title="Preparation Report"
        width={700}
      >
        <Space style={{ marginBottom: 16 }}>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            format="YYYY-MM-DD"
          />
          <Button type="primary" onClick={fetchReport} loading={loading}>
            Fetch
          </Button>
          <Button onClick={exportCSV} disabled={!report.length}>
            Export CSV
          </Button>
        </Space>

        {report.length > 0 ? (
          <>
            <p>
              <strong>Delivery Date:</strong>{" "}
              {dayjs(report[0].deliveryDate).utc().format("YYYY-MM-DD")}
            </p>
            <p>
              <strong>Total Packets:</strong> {report[0].packets}
            </p>
            <Table
              columns={columns}
              dataSource={report[0].items}
              rowKey="name"
              pagination={false}
              bordered
            />
          </>
        ) : (
          <p>No report loaded</p>
        )}
      </Modal>
    </>
  );
};

export default PreparationReportModal;
