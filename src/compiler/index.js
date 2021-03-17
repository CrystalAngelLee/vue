/* @flow */

import { parse } from "./parser/index";
import { optimize } from "./optimizer";
import { generate } from "./codegen/index";
import { createCompilerCreator } from "./create-compiler";

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile(
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 1. 把模板转换成ast抽象语法树
  // 抽象语法树，用来以树形的方式描述代码结构
  // 返回生成的AST对象
  const ast = parse(template.trim(), options);
  if (options.optimize !== false) {
    // 2. 优化抽象语法树
    optimize(ast, options);
  }
  // 3. 把抽象语法树生成字符串形式的JS代码
  const code = generate(ast, options);
  return {
    ast,
    /* 渲染函数：字符串形式的 */
    render: code.render,
    /* 静态渲染函数，生成静态VNode树 */
    staticRenderFns: code.staticRenderFns,
  };
});

/**
 * parse函数：
 * 依次遍历html字符串，把html字符串转换成AST对象
 */
