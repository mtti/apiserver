import express = require('express');
export * from './dependencies';

/** Raw document */
export interface IDocument {
  [name: string]: any;
}
