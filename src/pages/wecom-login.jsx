import React from "react";
import { useNavigate } from "react-router-dom";
import http from "../lib/http";
import { setAccessToken } from "@/auth/token";

function isWeComBrowser() {
  const ua = String(navigator.userAgent || "").toLowerCase();
  return ua.includes("wxwork");
}

function normalizeBaseUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/g, "");
}

function buildApiBaseAbsolute() {
  const configured = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (!configured) {
    return normalizeBaseUrl(`${window.location.origin}/api`);
  }
  if (/^https?:\/\//i.test(configured)) {
    return configured;
  }
  // 相对路径（如 /api），补齐为绝对地址
  return normalizeBaseUrl(`${window.location.origin}${configured.startsWith("/") ? "" : "/"}${configured}`);
}

export default function WeComLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    setError("");
    setLoading(true);

    const debug = String(import.meta.env.VITE_WECOM_DEBUG || "").toLowerCase() === "true";

    const appid =  "wx4e1b9d71380aa05b";
    const agentid =  "1000087";
    const loginType = "CorpApp";
    const state = "wecom_web_login";
    const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/+$/g, "");
    const envRedirectUri = String(import.meta.env.VITE_WECOM_REDIRECT_URI || "").trim();
    const redirectUriRaw = envRedirectUri || `${window.location.origin}${baseUrl}/callback`;
    const redirectUriEncoded = encodeURIComponent(redirectUriRaw);

    // 企业微信内置浏览器：走 OAuth2 静默授权（自动回调，不展示扫码）
    if (isWeComBrowser()) {
      try {
        const urlQuery = new URLSearchParams(window.location.search || "");
        const redirectRaw = urlQuery.get("redirect") || "";
        // 通过 state 携带 redirect，回调页再解析并跳转
        const packedState = `wecom_auto|${encodeURIComponent(redirectRaw)}`;

        // redirectUri 指向后端回调接口更稳（由后端再重定向回前端 callback 页面）
        const apiBaseAbs = buildApiBaseAbsolute();
        const backendCallback = `${apiBaseAbs}/wecom/auth/callback`;

        http
          .get("/wecom/auth/oauth2/authorize", {
            params: {
              redirectUri: backendCallback,
              state: packedState,
              scope: "snsapi_base",
            },
          })
          .then((res) => {
            const url = res?.data?.data;
            if (!url) {
              setError("获取企业微信授权地址失败");
              setLoading(false);
              return;
            }
            window.location.replace(url);
          })
          .catch((e) => {
            const msg = e?.response?.data?.errorMsg || e?.message || "获取企业微信授权地址失败";
            setError(msg);
            setLoading(false);
          });
      } catch (e) {
        setError(e?.message || "初始化企业微信授权失败");
        setLoading(false);
      }
      return () => {
        // 企业微信内置浏览器不会创建扫码面板，无需清理
      };
    }

    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[wecom-login] env:", {
        VITE_WECOM_DEBUG: import.meta.env.VITE_WECOM_DEBUG,
        VITE_WECOM_REDIRECT_URI: import.meta.env.VITE_WECOM_REDIRECT_URI,
        BASE_URL: import.meta.env.BASE_URL,
      });
      // eslint-disable-next-line no-console
      console.log("[wecom-login] computed:", {
        origin: window.location.origin,
        baseUrl,
        redirectUriRaw,
        redirectUriEncoded,
        appid,
        agentid,
        loginType,
        state,
        isWeComBrowser: isWeComBrowser(),
      });
    }

    function loadScript(src) {
      return new Promise((resolve, reject) => {
        const existed = Array.from(document.getElementsByTagName("script")).some(
          (s) => s.src === src
        );
        if (existed) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("企业微信登录组件加载失败"));
        document.body.appendChild(script);
      });
    }

    // 企业微信登录面板
    function initPanel() {
      const ww = window.ww;
      if (!ww || typeof ww.createWWLoginPanel !== "function") {
        throw new Error("企业微信登录组件未就绪");
      }

      const el = "#ww_login";
      if (!document.querySelector(el)) {
        throw new Error("登录面板容器未渲染：#ww_login");
      }
      const panel = ww.createWWLoginPanel({
        el,
        params: {
          login_type: loginType,
          appid,
          agentid,
          redirect_uri: redirectUriRaw,
          state,
          redirect_type: "callback",
        },
        onLoginSuccess: ({ code }) => {
          if (debug) {
            // eslint-disable-next-line no-console
            console.log("[wecom-login] onLoginSuccess:", { code, state });
          }

          const urlQuery = new URLSearchParams(window.location.search || "");
          const redirectRaw = urlQuery.get("redirect") || "";
          const safeRedirect = (() => {
            if (!redirectRaw) return "";
            try {
              const decoded = decodeURIComponent(redirectRaw);
              if (!decoded.startsWith("/")) return "";
              const p = decoded.split("?")[0] || "";
              if (p === `${baseUrl}/wecom-login` || p === `${baseUrl}/callback`) return "";
              return baseUrl && decoded.startsWith(baseUrl + "/")
                ? decoded.slice(baseUrl.length)
                : decoded;
            } catch (e) {
              return "";
            }
          })();

          http
            .post("/wecom/auth/login", null, { params: { code, state } })
            .then((res) => {
              const data = res?.data?.data;
              const token = data?.token;
              if (!token) {
                setError("登录失败：未获取到 token");
                return;
              }

              // access token 仅存内存，避免 XSS 直接读 localStorage
              setAccessToken(token);
              return http.get("/user/info");
            })
            .then((infoRes) => {
              if (!infoRes) return;
              const role = infoRes?.data?.data?.role || "";

              if (safeRedirect) {
                window.location.replace(`${window.location.origin}${baseUrl}${safeRedirect}`);
                return;
              }
              if (role === "CUSTOMER") {
                window.location.replace(`${window.location.origin}${baseUrl}/query-reports`);
                return;
              }
              window.location.replace(`${window.location.origin}${baseUrl}/`);
            })
            .catch((e) => {
              const data = e?.response?.data;
              if (debug) {
                // eslint-disable-next-line no-console
                console.log("[wecom-login] backend login error:", {
                  message: e?.message,
                  status: e?.response?.status,
                  data,
                });
              }
              const msg = data?.errorMsg || data?.message || e?.message || "登录失败";
              setError(msg);
            });
        },
        onLoginFail: (err) => {
          const msg = err?.message || "企业微信登录失败";
          setError(msg);
        },
      });
      panelRef.current = panel;
    }

    const sources = [
      "https://wwcdn.weixin.qq.com/node/open/js/wecom-jssdk-2.3.2.js",
      "https://wwcdn.weixin.qq.com/node/open/js/wecom-jssdk-1.3.1.js",
    ];

    (async () => {
      try {
        if (!window.ww || typeof window.ww.createWWLoginPanel !== "function") {
          let loaded = false;
          for (const src of sources) {
            try {
              await loadScript(src);
              loaded = true;
              break;
            } catch (e) {
              // ignore
            }
          }
          if (!loaded) {
            throw new Error("企业微信登录组件加载失败");
          }
        }

        await new Promise((r) => requestAnimationFrame(() => r()));
        initPanel();
      } catch (e) {
        setError(e?.message || "初始化企业微信登录失败");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      try {
        panelRef.current?.unmount?.();
      } catch (e) {
        // ignore
      }
      panelRef.current = null;
    };
  }, [navigate]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>COA数据平台</h2>

      {loading ? <p>加载中...</p> : null}
      {error ? <p style={{ color: "#d00" }}>{error}</p> : null}

      <div style={{ marginTop: 12 }}>
        <div id="ww_login" />
      </div>
    </div>
  );
}
