import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  message,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function AuthPage({ mode = "login" }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const url =
        mode === "login"
          ? "http://localhost:5000/api/auth/login"
          : "http://localhost:5000/api/auth/signup";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(data.message || `${mode} successful`);

        if (mode === "login") {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/");
        } else {
          navigate("/login");
        }
      } else {
        message.error(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      message.error("Server error, please try again later");
    } finally {
      setLoading(false);
    }
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
              {mode === "login" ? "Welcome back" : "Create an account"}
            </Title>
            <Text type="secondary">
              {mode === "login"
                ? "Login to the Dashboard"
                : "Sign up to get started"}
            </Text>

            <Form
              name={mode}
              layout="vertical"
              style={{ marginTop: 30 }}
              onFinish={onFinish}
            >
              {mode === "signup" && (
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
              )}

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Invalid email format!" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
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

              {mode === "login" && (
                <Form.Item name="remember" valuePropName="checked">
                  <Checkbox>Remember me</Checkbox>
                </Form.Item>
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LoginOutlined />}
                  block
                  size="large"
                  style={{ borderRadius: 6 }}
                  loading={loading}
                >
                  {mode === "login" ? "LOGIN" : "SIGN UP"}
                </Button>
              </Form.Item>
            </Form>

            {/* 🔗 Toggle link */}
            <div style={{ marginTop: 10 }}>
              {mode === "login" ? (
                <Text>
                  Don’t have an account? <Link to="/signup">Sign Up</Link>
                </Text>
              ) : (
                <Text>
                  Already have an account? <Link to="/login">Login</Link>
                </Text>
              )}
            </div>
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
