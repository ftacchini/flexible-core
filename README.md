# Table of Contents

1. [Introduction](#flexible)
1. [Getting started](#getting-started)
1. [Available Frameworks and Event Sources](#available-frameworks-and-event-sources)
1. [Architecture](#architecture)
1. [How-tos](#how-tos)
    1. [How-to build an event source](#architecture)
    1. [How-to build a framework](#architecture)
    1. [How-to create your logger](#architecture)
    1. [How-to create your router](#architecture)
1. [FAQ](#architecture)
1. [Contacts](#architecture)
1. [Issues](#architecture)
1. [License](#architecture)



## Flexible

Flexible is a library that helps you build event processing pipelines by connecting Event Sources to Frameworks. Event Sources provide events 
as javascript objects and flexible routes them through middleware structured according to the Frameworks of your choice.

## Getting started

To start using flexible you need to install flexible's core package, one or more event sources and one or more frameworks.

````
npm install flexible-core
npm install flexible-http #or any other
npm install flexible-decorators #or any other
````

Once that's done, you need to initialize your app and you are good to go!


`````
----------------------
./index.ts:
----------------------

const httpEventSource = HttpModuleBuilder.instance
    .build();

const decoratorsFramework = DecoratorsFrameworkModuleBuilder.instance
    .withControllerLoader(new ExplicitControllerLoader([
        HelloController
    ]))
    .build();

const application = FlexibleAppBuilder.instance
    .addEventSource(httpEventSource)
    .addFramework(decoratorsFramework)
    .createApp();

application.run().then(status => {
    console.log(JSON.stringify(status));
});

----------------------
./hello-controller.ts:
----------------------

@Controller({ filter: HttpMethod })
export class HelloController {

    @Route(HttpGet)
    public world(): any {
        return "hello world";
    }

}
`````

## Available Frameworks and Event Sources

### Frameworks

1. [flexible-decorators](https://github.com/ftacchini/flexible-decorators): a framework that uses typescript decorators to create controllers that shape your pipelines. 
1. [flexible-dummy-framework](https://github.com/ftacchini/flexible-dummy-framework): a framework that helps you to easily create integration tests for newly created event sources.

### Event Sources

1. [flexible-http](https://github.com/ftacchini/flexible-http): an event source that allows you to feed and filter http and https events into pipelines.
1. [flexible-dummy-source](https://github.com/ftacchini/flexible-dummy-source): an event sources that helps you easily create integration tests for newly created frameworks.

## Architecture

A simplified schema of Flexible can be seen below:

![Flexible's architecture](docs/img/flexible-core_31-7-21.png)

- Flexible Core: 
- Frameworks:
- Event Sources:
- User Code: 

## How do I create an Event Source?

## How do I create a Framework?