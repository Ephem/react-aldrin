// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
    input: 'src/react/index.js',
    output: {
        file: 'react.js',
        format: 'umd',
        name: 'SSRRenderer',
        globals: {
            react: 'React'
        }
    },
    plugins: [
        resolve({
            customResolveOptions: {
                moduleDirectory: 'node_modules'
            }
        }),
        babel({
            babelrc: false,
            exclude: 'node_modules/**', // only transpile our source code
            presets: [
                [
                    'babel-preset-env',
                    {
                        modules: false
                    }
                ],
                'react'
            ],
            plugins: ['transform-class-properties', 'external-helpers']
        }),
        uglify()
    ],
    external: ['react']
};
