/* @flow */

import { extend } from "shared/util";
import { detectErrors } from "./error-detector";
import { createCompileToFunctionFn } from "./to-function";

export function createCompilerCreator(baseCompile: Function): Function {
  // baseOption 平台相关的options
  return function createCompiler(baseOptions: CompilerOptions) {
    // 作用：合并选项，调用 baseCompile 进行编译，记录错误， 返回编译好的对象
    function compile(
      template: string,
      /* 调用 compileToFunctions 时传入的选项 */
      options?: CompilerOptions
    ): CompiledResult {
      // 用来合并baseOptions和options
      const finalOptions = Object.create(baseOptions);
      // 存储编译过程中出现的一些错误和信息
      const errors = [];
      const tips = [];

      // 把消息放入对应的数组中
      let warn = (msg, range, tip) => {
        (tip ? tips : errors).push(msg);
      };

      if (options) {
        if (
          process.env.NODE_ENV !== "production" &&
          options.outputSourceRange
        ) {
          // $flow-disable-line
          const leadingSpaceLength = template.match(/^\s*/)[0].length;

          warn = (msg, range, tip) => {
            const data: WarningMessage = { msg };
            if (range) {
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength;
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength;
              }
            }
            (tip ? tips : errors).push(data);
          };
        }
        // merge custom modules
        if (options.modules) {
          finalOptions.modules = (baseOptions.modules || []).concat(
            options.modules
          );
        }
        // merge custom directives
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          );
        }
        // copy other options
        for (const key in options) {
          if (key !== "modules" && key !== "directives") {
            finalOptions[key] = options[key];
          }
        }
      }

      finalOptions.warn = warn;

      // 模板编译的核心函数：baseCompile
      // 通过 baseCompile 将模板编译为编译函数
      // 返回 { render, staticRenderFns }
      const compiled = baseCompile(template.trim(), finalOptions);
      if (process.env.NODE_ENV !== "production") {
        detectErrors(compiled.ast, warn);
      }
      compiled.errors = errors;
      compiled.tips = tips;
      return compiled;
    }

    return {
      compile,
      compileToFunctions: createCompileToFunctionFn(compile),
    };
  };
}
