import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDateComponent } from './new-date.component';

describe('NewDateComponent', () => {
  let component: NewDateComponent;
  let fixture: ComponentFixture<NewDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewDateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
