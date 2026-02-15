import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import http from "@/lib/http";
import { setAccessToken } from "@/auth/token";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function extractRedirectFromState(state) {
  if (!state) return "";
  const raw = String(state);
  const prefix = "wecom_auto|";
  if (!raw.startsWith(prefix)) return "";
  const packed = raw.slice(prefix.length);
  if (!packed) return "";
  try {
    return decodeURIComponent(packed);
  } catch (e) {
    return "";
  }
}

export default function WeComCallback() {
  const query = useQuery();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    let disposed = false;

    const code = query.get("code") || "";
    const state = query.get("state") || "";

    if (!code) {
      setError("回调缺少 code 参数");
      setLoading(false);
      return;
    }

    http
      .post("/wecom/auth/login", null, {
        params: {
          code,
          state,
        },
        signal: controller.signal,
      })
      .then((res) => {
        const data = res?.data?.data;
        const token = data?.token;
        if (!token) {
          setError("登录失败：未获取到 token");
          return;
        }

        // access token 仅存内存，避免 XSS 直接读 localStorage
        setAccessToken(token);

        return http.get("/user/info", { signal: controller.signal });
      })
      .then((infoRes) => {
        const baseUrl = String(import.meta.env.BASE_URL || "/").replace(/\/+$/g, "");
        const redirectRaw = query.get("redirect") || extractRedirectFromState(state) || "";
        const safeRedirect = (() => {
          if (!redirectRaw) return "";
          try {
            const decoded = (() => {
              try {
                return decodeURIComponent(String(redirectRaw));
              } catch (e) {
                return String(redirectRaw);
              }
            })();

            if (!decoded.startsWith("/")) return "";

            // 保留完整路径（包含 query/hash）
            const url = new URL(decoded, window.location.origin);
            const pathWithSearchHash = `${url.pathname}${url.search || ""}${url.hash || ""}`;

            // 仅用 pathname 做循环跳转判断
            const p = url.pathname || "";
            if (p === `${baseUrl}/wecom-login` || p === `${baseUrl}/callback`) return "";

            return baseUrl && pathWithSearchHash.startsWith(baseUrl + "/")
              ? pathWithSearchHash.slice(baseUrl.length)
              : pathWithSearchHash;
          } catch (e) {
            return "";
          }
        })();

        const role = infoRes?.data?.data?.role || "";

        // 直接跳转到真正首页，避免先进入 / 再 RootRedirect 二次跳转
        const adminHomePath = "/main";

        if (safeRedirect) {
          window.location.replace(`${window.location.origin}${baseUrl}${safeRedirect}`);
          return;
        }

        if (role === "CUSTOMER") {
          window.location.replace(`${window.location.origin}${baseUrl}/query-reports`);
          return;
        }

        // 登录成功，直接进入真实首页
        window.location.replace(`${window.location.origin}${baseUrl}${adminHomePath}`);
      })
      .catch((e) => {
        if (e?.name === "CanceledError") return;
        if (e?.name === "AbortError") return;
        if (disposed) return;
        const msg = e?.response?.data?.errorMsg || e?.message || "登录失败";
        setError(msg);
      })
      .finally(() => {
        if (disposed) return;
        setLoading(false);
      });

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [navigate, query]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      {!error && loading ? <p style={{ textAlign: "center" }}>正在登录...</p> : null}
      {error ? (
        <div>
          <p style={{ color: "#d00" }}>{error}</p>
          <button
            type="button"
            onClick={() => navigate("/wecom-login", { replace: true })}
            style={{ marginTop: 12 }}
          >
            返回登录页
          </button>
        </div>
      ) : (
        <div style={{ height: 8 }} />
      )}
    </div>
  );
}
