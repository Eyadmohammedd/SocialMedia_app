export class ApplicationException extends Error {
  constructor(
    override message: string,
    public statusCode: number,
    override cause?: unknown
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class A {
  constructor(public name: string) {}
}

class B extends A {
  constructor(override name: string) {
    super(name);
  }
}

const b = new B(" ");
console.log(b);