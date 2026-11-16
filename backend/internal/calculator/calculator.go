// Package calculator holds the arithmetic rules, independent of any transport.
package calculator

import (
	"errors"
	"fmt"
	"math"
	"sort"
)

type Operation string

const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	Sqrt       Operation = "sqrt"
	Percentage Operation = "percentage"
)

var (
	ErrUnknownOperation = errors.New("unknown operation")
	ErrOperandCount     = errors.New("wrong number of operands")
	ErrInvalidOperand   = errors.New("operands must be finite numbers")
	ErrDivisionByZero   = errors.New("division by zero")
	ErrNegativeSqrt     = errors.New("square root of a negative number")
	ErrOutOfRange       = errors.New("result is out of range")
)

type rule struct {
	arity int
	apply func(x []float64) (float64, error)
}

var rules = map[Operation]rule{
	Add:      {2, func(x []float64) (float64, error) { return x[0] + x[1], nil }},
	Subtract: {2, func(x []float64) (float64, error) { return x[0] - x[1], nil }},
	Multiply: {2, func(x []float64) (float64, error) { return x[0] * x[1], nil }},
	Divide: {2, func(x []float64) (float64, error) {
		if x[1] == 0 {
			return 0, ErrDivisionByZero
		}
		return x[0] / x[1], nil
	}},
	Power: {2, func(x []float64) (float64, error) { return math.Pow(x[0], x[1]), nil }},
	Sqrt: {1, func(x []float64) (float64, error) {
		if x[0] < 0 {
			return 0, ErrNegativeSqrt
		}
		return math.Sqrt(x[0]), nil
	}},
	// percentage(a, b) is "a percent of b", e.g. percentage(15, 200) = 30.
	Percentage: {2, func(x []float64) (float64, error) { return x[0] * x[1] / 100, nil }},
}

// Calculate runs op over the operands and rejects results that aren't finite.
func Calculate(op Operation, operands []float64) (float64, error) {
	r, ok := rules[op]
	if !ok {
		return 0, fmt.Errorf("%w: %q", ErrUnknownOperation, op)
	}
	if len(operands) != r.arity {
		return 0, fmt.Errorf("%w: %s expects %d, got %d", ErrOperandCount, op, r.arity, len(operands))
	}
	for _, v := range operands {
		if math.IsNaN(v) || math.IsInf(v, 0) {
			return 0, ErrInvalidOperand
		}
	}

	res, err := r.apply(operands)
	if err != nil {
		return 0, err
	}
	// e.g. power(-8, 0.5) gives NaN, power(10, 400) gives +Inf
	if math.IsNaN(res) || math.IsInf(res, 0) {
		return 0, ErrOutOfRange
	}
	return res, nil
}

// Arity returns how many operands op takes.
func Arity(op Operation) (int, bool) {
	r, ok := rules[op]
	return r.arity, ok
}

// Operations lists the supported operations in a stable order.
func Operations() []Operation {
	ops := make([]Operation, 0, len(rules))
	for op := range rules {
		ops = append(ops, op)
	}
	sort.Slice(ops, func(i, j int) bool { return ops[i] < ops[j] })
	return ops
}
