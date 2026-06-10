import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActionBarComponent } from "./components/action-bar/action-bar.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ActionBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('file-manager');
}
