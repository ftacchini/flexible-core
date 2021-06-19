# Table of Contents

1. [What is flexible](#flexible)
1. [Getting started with flexible](#what-is-flexible)
1. [Available Components](#what-is-flexible)




Architecture

How tos
How to build an event source
How to build a framework
How to create your logger
How to create your router


## What is flexible {#flexible}

Flexible is a development platform that lets you build applications by connecting Event Sources to Frameworks. Many of the nowadays existing platforms are a bundle of both, an event source, and a way of processing that event. With flexible you can choose one or more event sources (http, web sockets, https, etc) and one or more frameworks (MVC like frameworks, plain js objects, etc) and connect them together. Lets make it more clear with an example:

Decorated Framework + Http Event Source:

`````
e1
`````

Pain JS Controllers + Http Event Source:

`````
e2
`````


What this means, is that you can use any event source (or more than one) in combination with any framework (or more than one) and flexible will plug them together for you. Also, building an event source will make it automatically compatible with every framework and viceversa. 

## How to create your first Flexible App?

npm install flexible-core
npm install flexible-http #or any other
npm install flexible-decorators #or any other

index.ts

`````
var eventSourceModule = 
var frameworkModule = 


var app = FlexibleAppBuilder.instance
    .addEventSource(eventSourceModule)
    .addFramework(frameworkModule)
    .createApp();

await app.start();
`````

cats-controller.ts

`````
@Controller()
@Route(HttpMethod)
export class CatsController {

    @Route(HttpGet, { path: "/:id" })
    public getCats(@FromPath() id: number) {
        return {
            id: id
        }
    }

    @Route(HttpGet, { path: "/" })
    public getCatById() {
        return [{ id: 1 }, { id: 2 }]
    }
}
`````


## Diagram

## How do I create an Event Source?

## How do I create a Framework?