---
.formatter: # (@formatter:off)
title: Functional Options in Go
draft: false
toc: true
authors:
  - janos-miko
tags:
  - go
  - golang
  - programming
categories: 
  - tech
date: '2023-02-25'
lastmod: '2023-03-04'
sitemap_exclude: false
featuredImage: /images/blog/2023-02-25-functional-options-in-go/functional-options-in-go.png
featuredImage_webp: /images/blog/2023-02-25-functional-options-in-go/functional-options-in-go.webp
---

Golang provides a fantastic way of writing functions called Functional Options. This is a design pattern that allows
callers to pass a set of options to a function, each represented by a function. Super flexible, and easy to use.

<!--more-->

This is the n+1th article about Golang functional options but there's a reason for that. It's a very useful pattern.
This pattern allows a lot of flexibility when writing functions, as each option can be composed together in any
combination desired.

## The problem

Consider a function called `TakeAWalk` that takes zero, one or multiple `Dog` as parameter, and we also pass the
destination. The `Dog` struct has a `Name` field.

Without functional options, the function would look something like this:

```go
type Dog struct {
	Name string
}

func TakeAWalk(destination string, dogs ...Dog) {
	// Do something with the dogs and destination 
	// for _, d := range dogs { 
	// fmt.Println("Dog name:", d.Name) 
	// }
	// Do something with the destination 
	// fmt.Println("Destination:", destination)
}
```

Until this point it's pretty simple. But what if we want to add more parameters to the function?

For example, I go to the mountains and I love it so much, next time I want to repeat and take a walk together with my
girlfriend, bringing our dogs, and we also want to bring a ball.

In this case we have to add new parameters to the function, and the function signature would start to look embarrassing.

There's a better way to do this, let's see how.

## Prepare the ground

First, extend our code with a `Walk` struct, that contains the options for the "walk". Create a method called `Go` that 
represents taking the walk.

```go
type Dog struct {
	Name string
}

type Walk struct {
	Dogs           []Dog
	Destination    string
	WithGirlfriend bool
	BallColor      string
}

func (w *Walk) Go() {
	// Do something with the options 
	if w.Destination == "" { 
	    // Set a default destination 
		w.Destination = "The park"
	}
	fmt.Println("I'm walking to:", w.Destination)

	if w.WithGirlfriend {
		fmt.Println("With my girlfriend")
	}

	if w.Dogs != nil {
		fmt.Println("With my dogs:")
		for _, dog := range w.Dogs {
			fmt.Println("-", dog.Name)
		}
	}

	if w.BallColor != "" {
		fmt.Println("And we are bringing a ball colored:", w.BallColor)
	}
}

```

Using this struct, define the a `walk` object and call its `Go` method:

```go
func main() {
	d1 := Dog{Name: "Pure"}
	d2 := Dog{Name: "Gerbaud"}
	
	walk := &Walk{
		Destination:    "The mountains", 
		WithGirlfriend: true, 
		Dogs: []Dog{d1, d2}, 
		BallColor: "red",
	}
	
	walk.Go()
}
```

Getting better, but if we want to modify an attribute of the `walk` object, we have to modify it outside.

To solve this, we can use functional options.

## Functional options

### The basics

Define functions that return a function that modifies the `Walk` struct. These functions are usually called `With*` functions.

```go
func WithDog(dog Dog) func(w *Walk) {
	return func(w *Walk) {
		w.Dogs = append(w.Dogs, dog)
	}
}
```

### Code cleanup

Let's make the code cleaner: define a new type called `Option` that represents all the functions that modify the `Walk` struct.

Use this `Option` to define the `With*` functions.

```go
type Option func(w *Walk)

func WithDog(dog Dog) Option {
	return func(w *Walk) {
		w.Dogs = append(w.Dogs, dog)
	}
}

func WithDestination(destination string) Option {
	return func(w *Walk) {
		w.Destination = destination
	}
}

func WithGirlfriend() Option {
	return func(w *Walk) {
		w.WithGirlfriend = true
	}
}

func WithBall(color string) Option {
	return func(w *Walk) {
		w.BallColor = color
	}
}
```

### Using the options

And lastly, we have to update the `Go` method to accept `Option` parameters.

```go
func (w *Walk) Go(opts ...Option) {
	// Apply the options to the WalkOptions struct
	for _, opt := range opts {
		opt(w)
	} 
	// Do something with the options
}
```

Now we can call the `Go` method like this:

```go
func main() {
	d1 := Dog{Name: "Pure"}
	d2 := Dog{Name: "Gerbaud"}
	
	// Initialize a new empty Walk 
	walk := &Walk{}
	walk.Go(WithDog(d1), WithDog(d2), WithDestination("the beach"))

	fmt.Println()

	// Initialize a new empty Walk
	walk = &Walk{}
	walk.Go(WithDestination("the mountains"))

	fmt.Println()
	// Reuse the previous walk, but this time with my girlfriend, dogs and a ball
	walk.Go(WithGirlfriend(), WithDog(d1), WithDog(d2), WithBall("red"))
}
```

And the output would be:

```text
I'm walking to: the beach
With my dogs:
- Pure
- Gerbaud

I'm walking to: the mountains

I'm walking to: the mountains
With my girlfriend
With my dogs:
- Pure
- Gerbaud
And we are bringing a ball colored: red

Program exited.
```

## Example Code

The final form of the code will look like this:

```go
package main

import (
	"fmt"
)

func main() {
	d1 := Dog{Name: "Pure"}
	d2 := Dog{Name: "Gerbaud"}

	// Initialize a new empty Walk
	walk := &Walk{}
	walk.Go(WithDog(d1), WithDog(d2), WithDestination("the beach"))

	fmt.Println()

	// Initialize a new empty Walk
	walk = &Walk{}
	walk.Go(WithDestination("the mountains"))

	fmt.Println()
	// Reuse the previous walk, but this time with my girlfriend, dogs and a ball
	walk.Go(WithGirlfriend(), WithDog(d1), WithDog(d2), WithBall("red"))
}

func (w *Walk) Go(opts ...Option) {
	// Apply the options to the WalkOptions struct
	for _, opt := range opts {
		opt(w)
	}

	// Do something with the options
	if w.Destination == "" {
		// Set a default destination
		w.Destination = "The park"
	}
	fmt.Println("I'm walking to:", w.Destination)

	if w.WithGirlfriend {
		fmt.Println("With my girlfriend")
	}

	if w.Dogs != nil {
		fmt.Println("With my dogs:")
		for _, dog := range w.Dogs {
			fmt.Println("-", dog.Name)
		}
	}

	if w.BallColor != "" {
		fmt.Println("And we are bringing a ball colored:", w.BallColor)
	}
}

type Option func(w *Walk)

func WithDog(dog Dog) Option {
	return func(w *Walk) {
		w.Dogs = append(w.Dogs, dog)
	}
}

func WithDestination(destination string) Option {
	return func(w *Walk) {
		w.Destination = destination
	}
}

func WithGirlfriend() Option {
	return func(w *Walk) {
		w.WithGirlfriend = true
	}
}

func WithBall(color string) Option {
	return func(w *Walk) {
		w.BallColor = color
	}
}

type Dog struct {
	Name string
}

type Walk struct {
	Dogs           []Dog
	Destination    string
	WithGirlfriend bool
	BallColor      string
}
```

## Conclusion

In this way, functional options provide an excellent way of writing flexible functions in Golang.

## Further reading

- [Functional Options for Friendly APIs](https://dave.cheney.net/2014/10/17/functional-options-for-friendly-apis)
- [Functional Options in Go](https://commandcenter.blogspot.com/2014/01/self-referential-functions-and-design.html)
