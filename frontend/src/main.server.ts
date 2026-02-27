import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (serverContext?: any) =>
  bootstrapApplication(AppComponent, config, serverContext);
export default bootstrap;
