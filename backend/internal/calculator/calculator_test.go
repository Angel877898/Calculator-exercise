package calculator

import (
	"errors"
	"math"
	"testing"
)

func TestCalculate(t *testing.T) {
	tests := []struct {
		name     string
		op       Operation
		operands []float64
		want     float64
	}{
		{"add", Add, []float64{2, 3}, 5},
		{"add negatives", Add, []float64{-2.5, -1.5}, -4},
		{"subtract", Subtract, []float64{10, 4}, 6},
		{"subtract below zero", Subtract, []float64{4, 10}, -6},
		{"multiply", Multiply, []float64{6, 7}, 42},
		{"multiply by zero", Multiply, []float64{123.45, 0}, 0},
		{"divide", Divide, []float64{9, 3}, 3},
		{"divide fraction", Divide, []float64{1, 4}, 0.25},
		{"divide zero numerator", Divide, []float64{0, 5}, 0},
		{"power", Power, []float64{2, 10}, 1024},
		{"power negative exponent", Power, []float64{2, -1}, 0.5},
		{"power zero", Power, []float64{0, 0}, 1},
		{"sqrt", Sqrt, []float64{81}, 9},
		{"sqrt zero", Sqrt, []float64{0}, 0},
		{"percentage", Percentage, []float64{15, 200}, 30},
		{"percentage of one", Percentage, []float64{50, 1}, 0.5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.op, tt.operands)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if math.Abs(got-tt.want) > 1e-9 {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	tests := []struct {
		name     string
		op       Operation
		operands []float64
		wantErr  error
	}{
		{"unknown op", "modulo", []float64{1, 2}, ErrUnknownOperation},
		{"empty op", "", []float64{1, 2}, ErrUnknownOperation},
		{"too few operands", Add, []float64{1}, ErrOperandCount},
		{"too many operands", Sqrt, []float64{4, 9}, ErrOperandCount},
		{"nil operands", Multiply, nil, ErrOperandCount},
		{"division by zero", Divide, []float64{1, 0}, ErrDivisionByZero},
		{"negative zero divisor", Divide, []float64{1, math.Copysign(0, -1)}, ErrDivisionByZero},
		{"negative sqrt", Sqrt, []float64{-4}, ErrNegativeSqrt},
		{"overflow", Power, []float64{10, 400}, ErrOutOfRange},
		{"multiply overflow", Multiply, []float64{math.MaxFloat64, 2}, ErrOutOfRange},
		{"complex root", Power, []float64{-8, 0.5}, ErrOutOfRange},
		{"NaN operand", Add, []float64{math.NaN(), 1}, ErrInvalidOperand},
		{"Inf operand", Add, []float64{math.Inf(1), 1}, ErrInvalidOperand},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Calculate(tt.op, tt.operands)
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("got error %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestArity(t *testing.T) {
	if n, ok := Arity(Sqrt); !ok || n != 1 {
		t.Errorf("sqrt arity = %d, %v", n, ok)
	}
	if n, ok := Arity(Divide); !ok || n != 2 {
		t.Errorf("divide arity = %d, %v", n, ok)
	}
	if _, ok := Arity("nope"); ok {
		t.Error("expected unknown operation to report !ok")
	}
}

func TestOperationsIsSortedAndComplete(t *testing.T) {
	ops := Operations()
	if len(ops) != 7 {
		t.Fatalf("got %d operations, want 7", len(ops))
	}
	for i := 1; i < len(ops); i++ {
		if ops[i-1] >= ops[i] {
			t.Fatalf("operations not sorted: %v", ops)
		}
	}
}
