import React from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
} from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Login() {
  const onFinish = (values) => {
    console.log("Success:", values);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Row>
          <Col xs={24} md={12} style={{ padding: "40px 30px" }}>
            <Title level={2} style={{ marginBottom: 10 }}>
              Welcome back
            </Title>
            <Text type="secondary">Login to the Dashboard</Text>

            <Form
              name="login"
              layout="vertical"
              style={{ marginTop: 30 }}
              onFinish={onFinish}
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: "Please input your username!" },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Username"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item name="remember" valuePropName="checked">
                <Checkbox>Remember me</Checkbox>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LoginOutlined />}
                  block
                  size="large"
                  style={{ borderRadius: 6 }}
                >
                  LOGIN
                </Button>
              </Form.Item>
            </Form>
          </Col>

          <Col
            xs={0}
            md={12}
            style={{
              backgroundImage: "url('/assets/login.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              height: "500px",
            }}
          />
        </Row>
      </Card>
    </div>
  );
}
