// Package api exposes the calculator over HTTP/JSON.
package api

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/Angel877898/calculator-exercise/backend/internal/calculator"
)

const maxBodyBytes = 1 << 16

type calculateRequest struct {
	Operation calculator.Operation `json:"operation"`
	// Pointers so a null inside the array is rejected instead of read as 0.
	Operands []*float64 `json:"operands"`
}

type calculateResponse struct {
	Operation calculator.Operation `json:"operation"`
	Operands  []float64            `json:"operands"`
	Result    float64              `json:"result"`
}

type operationInfo struct {
	Name     calculator.Operation `json:"name"`
	Operands int                  `json:"operands"`
}

type errorBody struct {
	Error apiError `json:"error"`
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type handler struct {
	log *slog.Logger
}

func (h *handler) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handler) operations(w http.ResponseWriter, _ *http.Request) {
	ops := calculator.Operations()
	out := make([]operationInfo, 0, len(ops))
	for _, op := range ops {
		n, _ := calculator.Arity(op)
		out = append(out, operationInfo{Name: op, Operands: n})
	}
	writeJSON(w, http.StatusOK, map[string]any{"operations": out})
}

func (h *handler) calculate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	var req calculateRequest
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request",
			`body must be JSON like {"operation": "add", "operands": [1, 2]}`)
		return
	}

	operands := make([]float64, len(req.Operands))
	for i, v := range req.Operands {
		if v == nil {
			writeError(w, http.StatusBadRequest, "invalid_operand", "operands cannot be null")
			return
		}
		operands[i] = *v
	}

	result, err := calculator.Calculate(req.Operation, operands)
	if err != nil {
		status, code := classify(err)
		if status >= http.StatusInternalServerError {
			h.log.Error("calculate failed", "op", req.Operation, "err", err)
		}
		writeError(w, status, code, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, calculateResponse{
		Operation: req.Operation,
		Operands:  operands,
		Result:    result,
	})
}

// classify maps domain errors to an HTTP status and a stable error code.
func classify(err error) (int, string) {
	switch {
	case errors.Is(err, calculator.ErrUnknownOperation):
		return http.StatusBadRequest, "unknown_operation"
	case errors.Is(err, calculator.ErrOperandCount):
		return http.StatusBadRequest, "invalid_operand_count"
	case errors.Is(err, calculator.ErrInvalidOperand):
		return http.StatusBadRequest, "invalid_operand"
	case errors.Is(err, calculator.ErrDivisionByZero):
		return http.StatusUnprocessableEntity, "division_by_zero"
	case errors.Is(err, calculator.ErrNegativeSqrt):
		return http.StatusUnprocessableEntity, "negative_sqrt"
	case errors.Is(err, calculator.ErrOutOfRange):
		return http.StatusUnprocessableEntity, "out_of_range"
	default:
		return http.StatusInternalServerError, "internal_error"
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, errorBody{Error: apiError{Code: code, Message: msg}})
}
