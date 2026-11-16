package api

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func newTestServer(t *testing.T, cfg Config) *httptest.Server {
	t.Helper()
	log := slog.New(slog.NewTextHandler(io.Discard, nil))
	srv := httptest.NewServer(NewRouter(cfg, log))
	t.Cleanup(srv.Close)
	return srv
}

func post(t *testing.T, srv *httptest.Server, body string) *http.Response {
	t.Helper()
	res, err := http.Post(srv.URL+"/api/v1/calculate", "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { res.Body.Close() })
	return res
}

func TestCalculateOK(t *testing.T) {
	srv := newTestServer(t, Config{})

	tests := []struct {
		body string
		want float64
	}{
		{`{"operation":"add","operands":[2,3]}`, 5},
		{`{"operation":"subtract","operands":[2,3]}`, -1},
		{`{"operation":"multiply","operands":[1.5,4]}`, 6},
		{`{"operation":"divide","operands":[10,4]}`, 2.5},
		{`{"operation":"power","operands":[3,3]}`, 27},
		{`{"operation":"sqrt","operands":[16]}`, 4},
		{`{"operation":"percentage","operands":[10,250]}`, 25},
	}

	for _, tt := range tests {
		t.Run(tt.body, func(t *testing.T) {
			res := post(t, srv, tt.body)
			if res.StatusCode != http.StatusOK {
				t.Fatalf("status = %d", res.StatusCode)
			}
			if ct := res.Header.Get("Content-Type"); ct != "application/json" {
				t.Errorf("content-type = %q", ct)
			}
			var got calculateResponse
			if err := json.NewDecoder(res.Body).Decode(&got); err != nil {
				t.Fatal(err)
			}
			if got.Result != tt.want {
				t.Errorf("result = %v, want %v", got.Result, tt.want)
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	srv := newTestServer(t, Config{})

	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantCode   string
	}{
		{"division by zero", `{"operation":"divide","operands":[1,0]}`, 422, "division_by_zero"},
		{"negative sqrt", `{"operation":"sqrt","operands":[-1]}`, 422, "negative_sqrt"},
		{"overflow", `{"operation":"power","operands":[10,1000]}`, 422, "out_of_range"},
		{"unknown op", `{"operation":"modulo","operands":[1,2]}`, 400, "unknown_operation"},
		{"missing operands", `{"operation":"add"}`, 400, "invalid_operand_count"},
		{"extra operand", `{"operation":"add","operands":[1,2,3]}`, 400, "invalid_operand_count"},
		{"null operand", `{"operation":"add","operands":[1,null]}`, 400, "invalid_operand"},
		{"string operand", `{"operation":"add","operands":["1",2]}`, 400, "invalid_request"},
		{"unknown field", `{"operation":"add","operands":[1,2],"x":1}`, 400, "invalid_request"},
		{"malformed json", `{"operation":`, 400, "invalid_request"},
		{"empty body", "", 400, "invalid_request"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res := post(t, srv, tt.body)
			if res.StatusCode != tt.wantStatus {
				t.Errorf("status = %d, want %d", res.StatusCode, tt.wantStatus)
			}
			var got errorBody
			if err := json.NewDecoder(res.Body).Decode(&got); err != nil {
				t.Fatal(err)
			}
			if got.Error.Code != tt.wantCode {
				t.Errorf("code = %q, want %q", got.Error.Code, tt.wantCode)
			}
			if got.Error.Message == "" {
				t.Error("expected an error message")
			}
		})
	}
}

func TestCalculateRejectsLargeBody(t *testing.T) {
	srv := newTestServer(t, Config{})
	body := `{"operation":"add","operands":[1,2],"pad":"` + strings.Repeat("a", maxBodyBytes) + `"}`
	if res := post(t, srv, body); res.StatusCode != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", res.StatusCode)
	}
}

func TestCalculateWrongMethod(t *testing.T) {
	srv := newTestServer(t, Config{})
	res, err := http.Get(srv.URL + "/api/v1/calculate")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want 405", res.StatusCode)
	}
}

func TestOperations(t *testing.T) {
	srv := newTestServer(t, Config{})
	res, err := http.Get(srv.URL + "/api/v1/operations")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()

	var got struct {
		Operations []operationInfo `json:"operations"`
	}
	if err := json.NewDecoder(res.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if len(got.Operations) != 7 {
		t.Fatalf("got %d operations", len(got.Operations))
	}
	for _, op := range got.Operations {
		if op.Name == "sqrt" && op.Operands != 1 {
			t.Errorf("sqrt operands = %d", op.Operands)
		}
	}
}

func TestHealth(t *testing.T) {
	srv := newTestServer(t, Config{})
	res, err := http.Get(srv.URL + "/healthz")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Errorf("status = %d", res.StatusCode)
	}
}

func TestCORS(t *testing.T) {
	srv := newTestServer(t, Config{AllowedOrigin: "http://localhost:5173"})

	req, _ := http.NewRequest(http.MethodOptions, srv.URL+"/api/v1/calculate", nil)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusNoContent {
		t.Errorf("preflight status = %d", res.StatusCode)
	}
	if got := res.Header.Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Errorf("allow-origin = %q", got)
	}
}

func TestNoCORSByDefault(t *testing.T) {
	srv := newTestServer(t, Config{})
	res := post(t, srv, `{"operation":"add","operands":[1,1]}`)
	if got := res.Header.Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("unexpected allow-origin %q", got)
	}
}

func TestStaticFallback(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html>app</html>"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "app.js"), []byte("console.log(1)"), 0o644); err != nil {
		t.Fatal(err)
	}
	srv := newTestServer(t, Config{StaticDir: dir})

	for path, want := range map[string]string{
		"/":          "app</html>",
		"/app.js":    "console.log",
		"/some/page": "app</html>",
	} {
		res, err := http.Get(srv.URL + path)
		if err != nil {
			t.Fatal(err)
		}
		b, _ := io.ReadAll(res.Body)
		res.Body.Close()
		if !strings.Contains(string(b), want) {
			t.Errorf("%s: body %q does not contain %q", path, b, want)
		}
	}
}
