package main

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

var PUBLIC = sdk.Export(inc, value)
var SYSTEM = sdk.Export(_init)

var COUNTER_KEY = []byte("counter")

func _init() {}

func inc() uint64 {
	v := value() + 1
	state.WriteUint64(COUNTER_KEY, v)
	return v
}

func value() uint64 {
	return state.ReadUint64(COUNTER_KEY)
}
