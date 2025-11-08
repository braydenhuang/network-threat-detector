// This is the entry point of the SolidJS application, see App.tsx to edit the UI

/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from "@solidjs/router";
import './index.css'
import App from './App'

const root = document.getElementById('root')

render(() =>
    <Router root={App}>
    </Router>,
    root!)
