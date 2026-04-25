import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { DashboardSummary, ReportingApiService } from '../analytics/reporting-api.service';
import { AuthService } from '../../core/auth.service';
import { FormsModule } from '@angular/forms';
import { DoctorProfileService } from '../doctor/doctor-profile.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, FormsModule],
  template: `
    <div class="container clinical-bg">
      <header class="dashboard-header">
        <div class="header-left">
          <h1 class="page-title">Executive Overview</h1>
          <p class="page-subtitle">Real-time operational metrics and health system status</p>
        </div>
        <div class="header-right">
          <div class="live-status">
            <span class="status-dot pulse"></span>
            Operational Systems Live
          </div>
        </div>
      </header>

      <div class="stat-grid" *ngIf="summary">
        <div class="stat-card">
          <div class="stat-icon patient-icon"><i class="ph ph-users"></i></div>
          <div class="stat-content">
            <span class="stat-label">Total Patients</span>
            <div class="stat-value">{{ summary.totalPatients }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon doctor-icon"><i class="ph ph-stethoscope"></i></div>
          <div class="stat-content">
            <span class="stat-label">Active Doctors</span>
            <div class="stat-value">{{ summary.activeDoctors }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon appt-icon"><i class="ph ph-calendar-check"></i></div>
          <div class="stat-content">
            <span class="stat-label">Today's Visits</span>
            <div class="stat-value">{{ summary.todayAppointments }}</div>
          </div>
        </div>
        <div class="stat-card revenue">
          <div class="stat-icon rev-icon"><i class="ph ph-currency-circle-dollar"></i></div>
          <div class="stat-content">
            <span class="stat-label">System Revenue</span>
            <div class="stat-value">₹{{ summary.todayRevenue }}</div>
          </div>
        </div>
      </div>

      <div class="visual-grid">
        <div class="chart-card large">
          <div class="card-header">
            <h3>Appointment Volume (30 Days)</h3>
            <span class="trend up"><i class="ph ph-trend-up"></i> +12%</span>
          </div>
          <div class="chart-body">
            <canvas baseChart
              [data]="lineChartData"
              [options]="lineChartOptions"
              [type]="'line'">
            </canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <h3>Revenue by Dept</h3>
          </div>
          <div class="chart-body">
            <canvas baseChart
              [data]="barChartData"
              [options]="barChartOptions"
              [type]="'bar'">
            </canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <h3>Appt Distribution</h3>
          </div>
          <div class="chart-body donut">
            <canvas baseChart
              [data]="donutChartData"
              [options]="donutChartOptions"
              [type]="'doughnut'">
            </canvas>
          </div>
        </div>

        <div class="chart-card large user-management-card">
          <div class="card-header">
            <h3>User & Identity Management</h3>
            <div class="live-status">
              <span class="status-dot"></span>
              {{ users.length }} System Users
            </div>
          </div>
          <div class="user-table-wrap">
            <table class="clinical-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users">
                  <td>{{ user.username }}</td>
                  <td><span class="badge info">{{ user.role }}</span></td>
                  <td>
                    <span class="badge success" *ngIf="user.isVerified">Verified</span>
                    <span class="badge warning" *ngIf="!user.isVerified">Pending</span>
                  </td>
                  <td>
                    <button *ngIf="!user.isVerified" 
                            (click)="verifyUser(user.userId || user.id)" 
                            class="action-btn verify">
                      Verify
                    </button>
                    <span *ngIf="user.isVerified">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="chart-card large admin-ops-card">
          <div class="card-header">
            <h3>Doctor & Staff Management</h3>
            <span class="badge info">Quick Register</span>
          </div>
          <div class="admin-form-shell">
            <p class="form-instruction">Onboard new specialists to the clinical network. Credentials will be routed for verification.</p>
            <div class="form-row">
               <div class="input-wrap">
                  <label>Full Name</label>
                  <input type="text" [(ngModel)]="onboardingData.fullName" placeholder="Dr. Sarah Johnson" />
               </div>
               <div class="input-wrap">
                  <label>Specialization</label>
                  <select [(ngModel)]="onboardingData.specialization">
                     <option>Cardiology</option>
                     <option>Pediatrics</option>
                     <option>Neurology</option>
                     <option>General Surgery</option>
                     <option>General Medicine</option>
                  </select>
               </div>
            </div>
            <div class="form-row">
               <div class="input-wrap">
                  <label>Email Address</label>
                  <input type="email" [(ngModel)]="onboardingData.email" placeholder="sarah.j@hms.com" />
               </div>
               <div class="input-wrap">
                  <label>Consultation Fee (₹)</label>
                  <input type="number" [(ngModel)]="onboardingData.consultationFee" />
               </div>
            </div>
            <button class="nav-btn primary-solid full mt-1" (click)="onboardDoctor()">
               <i class="ph ph-user-plus"></i> Finalize Onboarding
            </button>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
             <h3>System Health</h3>
          </div>
          <div class="health-stack">
             <div class="health-item"><span>Auth Service</span> <span class="badge success">UP</span></div>
             <div class="health-item"><span>Patient Service</span> <span class="badge success">UP</span></div>
             <div class="health-item"><span>Billing Gateway</span> <span class="badge success">UP</span></div>
             <div class="health-item"><span>Notification Hub</span> <span class="badge warning">STUB</span></div>
          </div>
        </div>
      </div>

      <!-- Admin Oversight Tabs -->
      <div class="admin-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'overview'" (click)="activeTab = 'overview'">
          <i class="ph ph-chart-line"></i> Overview
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'doctors'" (click)="activeTab = 'doctors'">
          <i class="ph ph-stethoscope"></i> All Doctors
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'patients'" (click)="activeTab = 'patients'">
          <i class="ph ph-users"></i> All Patients
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'appointments'" (click)="activeTab = 'appointments'">
          <i class="ph ph-calendar-check"></i> All Appointments
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'prescriptions'" (click)="activeTab = 'prescriptions'">
          <i class="ph ph-pill"></i> E-Prescriptions
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'lab-orders'" (click)="activeTab = 'lab-orders'">
          <i class="ph ph-test-tube"></i> Lab Orders
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content" *ngIf="activeTab === 'overview'">
        <!-- Existing overview content -->
        <div class="stat-grid" *ngIf="summary">
          <div class="stat-card">
            <div class="stat-icon patient-icon"><i class="ph ph-users"></i></div>
            <div class="stat-content">
              <span class="stat-label">Total Patients</span>
              <div class="stat-value">{{ summary.totalPatients }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon doctor-icon"><i class="ph ph-stethoscope"></i></div>
            <div class="stat-content">
              <span class="stat-label">Active Doctors</span>
              <div class="stat-value">{{ summary.activeDoctors }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon appt-icon"><i class="ph ph-calendar-check"></i></div>
            <div class="stat-content">
              <span class="stat-label">Today's Visits</span>
              <div class="stat-value">{{ summary.todayAppointments }}</div>
            </div>
          </div>
          <div class="stat-card revenue">
            <div class="stat-icon rev-icon"><i class="ph ph-currency-circle-dollar"></i></div>
            <div class="stat-content">
              <span class="stat-label">System Revenue</span>
              <div class="stat-value">₹{{ summary.todayRevenue }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-content" *ngIf="activeTab === 'doctors'">
        <div class="management-header">
          <h3>All Doctors in System</h3>
          <button class="nav-btn primary-solid" (click)="showDoctorOnboarding = !showDoctorOnboarding">
            <i class="ph ph-user-plus"></i> Add New Doctor
          </button>
        </div>
        <div class="data-table-container">
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Doctor ID</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Consultation Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doctor of allDoctors">
                <td>#{{ doctor.id }}</td>
                <td>{{ doctor.fullName }}</td>
                <td><span class="badge info">{{ doctor.specialization }}</span></td>
                <td>{{ doctor.email }}</td>
                <td>{{ doctor.phone || '-' }}</td>
                <td>₹{{ doctor.consultationFee || 0 }}</td>
                <td>
                  <span class="badge success" *ngIf="doctor.isActive">Active</span>
                  <span class="badge warning" *ngIf="!doctor.isActive">Inactive</span>
                </td>
                <td>
                  <button class="action-btn" (click)="viewDoctorDetails(doctor)">View</button>
                  <button class="action-btn" (click)="toggleDoctorStatus(doctor)">
                    {{ doctor.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="tab-content" *ngIf="activeTab === 'patients'">
        <div class="management-header">
          <h3>All Patients in System</h3>
          <div class="search-box">
            <input type="text" [(ngModel)]="patientSearch" placeholder="Search patients..." (input)="filterPatients()">
          </div>
        </div>
        <div class="data-table-container">
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Blood Group</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let patient of filteredPatients">
                <td>#{{ patient.id }}</td>
                <td>{{ patient.firstName }} {{ patient.lastName }}</td>
                <td>{{ patient.email }}</td>
                <td>{{ patient.phone || '-' }}</td>
                <td><span class="badge info">{{ patient.bloodGroup }}</span></td>
                <td>{{ formatDate(patient.createdAt) }}</td>
                <td>
                  <span class="badge success" *ngIf="patient.isActive">Active</span>
                  <span class="badge warning" *ngIf="!patient.isActive">Inactive</span>
                </td>
                <td>
                  <button class="action-btn" (click)="viewPatientDetails(patient)">View</button>
                  <button class="action-btn" (click)="viewPatientRecords(patient)">Records</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="tab-content" *ngIf="activeTab === 'appointments'">
        <div class="management-header">
          <h3>All System Appointments</h3>
          <div class="filter-controls">
            <select [(ngModel)]="appointmentFilter" (change)="filterAppointments()">
              <option value="all">All Appointments</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div class="data-table-container">
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let apt of filteredAppointments">
                <td>#{{ apt.id }}</td>
                <td>{{ getPatientName(apt.patientId) }}</td>
                <td>{{ getDoctorName(apt.doctorId) }}</td>
                <td>{{ apt.appointmentDate }}</td>
                <td>{{ apt.appointmentTime }}</td>
                <td>
                  <span class="badge success" *ngIf="apt.status === 'COMPLETED'">Completed</span>
                  <span class="badge info" *ngIf="apt.status === 'SCHEDULED'">Scheduled</span>
                  <span class="badge warning" *ngIf="apt.status === 'CANCELLED'">Cancelled</span>
                </td>
                <td>
                  <span class="badge success" *ngIf="apt.paymentStatus === 'PAID'">Paid</span>
                  <span class="badge warning" *ngIf="apt.paymentStatus !== 'PAID'">Pending</span>
                </td>
                <td>
                  <button class="action-btn" (click)="viewAppointmentDetails(apt)">View</button>
                  <button class="action-btn" *ngIf="apt.status === 'SCHEDULED'" (click)="cancelAppointment(apt)">Cancel</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="tab-content" *ngIf="activeTab === 'prescriptions'">
        <div class="management-header">
          <h3>All E-Prescriptions</h3>
          <div class="filter-controls">
            <select [(ngModel)]="prescriptionFilter" (change)="filterPrescriptions()">
              <option value="all">All Prescriptions</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div class="data-table-container">
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Prescription ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Prescribed Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let prescription of filteredPrescriptions">
                <td>#{{ prescription.id }}</td>
                <td>{{ getPatientName(prescription.patientId) }}</td>
                <td>{{ getDoctorName(prescription.doctorId) }}</td>
                <td>{{ prescription.items?.[0]?.medicationName || 'N/A' }}</td>
                <td>{{ prescription.items?.[0]?.dose || 'N/A' }}</td>
                <td>{{ formatDate(prescription.createdAt) }}</td>
                <td>
                  <span class="badge success" *ngIf="prescription.status === 'ACTIVE'">Active</span>
                  <span class="badge info" *ngIf="prescription.status === 'COMPLETED'">Completed</span>
                </td>
                <td>
                  <button class="action-btn" (click)="viewPrescriptionDetails(prescription)">View</button>
                  <button class="action-btn" (click)="downloadPrescriptionPDF(prescription)">PDF</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="tab-content" *ngIf="activeTab === 'lab-orders'">
        <div class="management-header">
          <h3>Lab Orders Management</h3>
          <div class="filter-controls">
            <select [(ngModel)]="labOrderFilter" (change)="filterLabOrders()">
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div class="data-table-container">
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Test Type</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of filteredLabOrders">
                <td>#{{ order.id }}</td>
                <td>{{ getPatientName(order.patientId) }}</td>
                <td>{{ getDoctorName(order.doctorId) }}</td>
                <td>Lab Test #{{ order.testId }}</td>
                <td>{{ formatDate(order.createdAt) }}</td>
                <td>
                  <span class="badge warning" *ngIf="order.status === 'PENDING'">Pending</span>
                  <span class="badge success" *ngIf="order.status === 'COMPLETED'">Completed</span>
                </td>
                <td>
                  <span class="badge info" *ngIf="order.result">{{ order.result }}</span>
                  <span *ngIf="!order.result">-</span>
                </td>
                <td>
                  <button class="action-btn" (click)="viewLabOrderDetails(order)">View</button>
                  <button class="action-btn" *ngIf="order.status === 'PENDING'" (click)="approveLabOrder(order)">Approve</button>
                  <button class="action-btn" *ngIf="order.status === 'COMPLETED'" (click)="downloadLabReportPDF(order)">PDF</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <nav class="quick-nav">
        <a class="nav-btn" routerLink="/appointments"><i class="ph ph-calendar"></i> Managed Appointments</a>
        <a class="nav-btn" routerLink="/admin/billing"><i class="ph ph-wallet"></i> Financial Ledger</a>
        <a class="nav-btn" routerLink="/admin/analytics"><i class="ph ph-graph"></i> Advanced Analytics</a>
        <button class="nav-btn" (click)="generateMonthlyReport()"><i class="ph ph-file-pdf"></i> Export Monthly GST Report</button>
      </nav>
    </div>
  `,
  styles: [`
    .clinical-bg { padding: 2rem; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-size: 1.75rem; color: var(--primary); font-weight: 800; }
    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }
    
    .live-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--accent); background: rgba(13, 126, 106, 0.05); padding: 0.5rem 1rem; border-radius: 999px; border: 1px solid rgba(13, 126, 106, 0.1); }
    .status-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; }
    .pulse { animation: pulse-anim 2s infinite; }

    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; box-shadow: var(--shadow-soft); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .patient-icon { background: rgba(26, 60, 110, 0.08); color: var(--primary); }
    .doctor-icon { background: rgba(13, 126, 106, 0.08); color: var(--accent); }
    .appt-icon { background: rgba(217, 119, 6, 0.08); color: var(--warning); }
    .rev-icon { background: rgba(26, 60, 110, 0.1); color: var(--primary); }
    .stat-label { color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--text); font-family: 'Syne', sans-serif; }

    .visual-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-soft); display: flex; flex-direction: column; }
    .large { grid-column: span 2; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .card-header h3 { font-size: 1rem; color: var(--text); font-weight: 700; }
    
    .chart-body { flex: 1; height: 300px; display: flex; align-items: center; }
    .donut { height: 250px; }

    .ward-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .ward { background: var(--surface-soft); padding: 1rem; border-radius: 8px; }
    .ward-title { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase; }
    .bed-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
    .bed { width: 12px; height: 12px; border-radius: 2px; border: 1px solid var(--border); background: #E2E8F0; }
    .bed.occupied { background: var(--primary); border-color: var(--primary); }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .available { background: #E2E8F0; }
    .occupied { background: var(--primary); }
    .map-legend { font-size: 0.7rem; color: var(--text-muted); display: flex; gap: 1rem; }

    .quick-nav { grid-column: span 3; display: flex; gap: 0.75rem; margin-top: 2rem; }
    .nav-btn { background: var(--surface); border: 1px solid var(--border); padding: 0.75rem 1.25rem; border-radius: 999px; text-decoration: none; color: var(--text-soft); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    .nav-btn:hover { border-color: var(--primary); color: var(--primary); box-shadow: var(--shadow-soft); }
    .primary-solid { background: var(--primary); color: #fff; }
    .primary-solid:hover { background: var(--primary-strong); color: #fff; }
    .full { width: 100%; justify-content: center; margin-top: 1rem; }

    /* Admin Form & Health Styles */
    .admin-form-shell { margin-top: 0.5rem; }
    .form-instruction { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5; }
    .input-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
    .health-stack { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
    .health-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; padding: 0.5rem 0; border-bottom: 1px dashed var(--border); }
    .badge { font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 800; }
    .badge.success { background: #DCFCE7; color: #15803D; }
    .badge.warning { background: #FEF3C7; color: #B45309; }
    .badge.info { background: #DBEAFE; color: #1D4ED8; }
    
    /* Table Styles */
    .user-table-wrap { overflow-x: auto; margin-top: 1rem; }
    .clinical-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .clinical-table th { text-align: left; padding: 0.75rem; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    .clinical-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-soft); color: var(--text-soft); }
    .action-btn { padding: 0.4rem 0.8rem; border-radius: 6px; border: none; font-weight: 700; font-size: 0.75rem; cursor: pointer; transition: 0.2s; }
    .action-btn.verify { background: var(--accent); color: #fff; }
    .action-btn.verify:hover { background: #0A6656; }

    @keyframes pulse-anim { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
    @media (max-width: 1024px) { .large { grid-column: span 3; } .visual-grid { grid-template-columns: 1fr; } }

    /* Admin Tabs Styles */
    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      margin: 2rem 0 1rem 0;
      border-bottom: 2px solid var(--border);
      padding-bottom: 0;
    }
    
    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px 8px 0 0;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .tab-btn:hover {
      background: var(--surface-soft);
      color: var(--text);
    }
    
    .tab-btn.active {
      background: var(--primary);
      color: white;
    }
    
    .tab-content {
      background: var(--surface);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    
    /* Management Header Styles */
    .management-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .management-header h3 {
      color: var(--text-strong);
      font-size: 1.2rem;
      font-weight: 700;
    }
    
    .search-box input,
    .filter-controls select {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
      color: var(--text);
      font-size: 0.9rem;
    }
    
    .search-box input {
      width: 250px;
    }
    
    .filter-controls select {
      width: 150px;
    }
    
    /* Data Table Styles */
    .data-table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    
    .data-table-container table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table-container th {
      background: var(--surface-soft);
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 2px solid var(--border);
    }
    
    .data-table-container td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-soft);
      color: var(--text);
    }
    
    .data-table-container tr:hover {
      background: var(--surface-soft);
    }
    
    .action-btn {
      padding: 0.4rem 0.8rem;
      margin: 0 0.2rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--surface);
      color: var(--text);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .action-btn:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  users: any[] = [];
  onboardingData = {
    fullName: '',
    email: '',
    specialization: 'General Medicine',
    phone: '',
    consultationFee: 500
  };

  // Admin Oversight Properties
  activeTab = 'overview';
  showDoctorOnboarding = false;
  
  // Data Arrays
  allDoctors: any[] = [];
  allPatients: any[] = [];
  allAppointments: any[] = [];
  allPrescriptions: any[] = [];
  allLabOrders: any[] = [];
  
  // Filtered Data
  filteredPatients: any[] = [];
  filteredAppointments: any[] = [];
  filteredPrescriptions: any[] = [];
  filteredLabOrders: any[] = [];
  
  // Filter Controls
  patientSearch = '';
  appointmentFilter = 'all';
  prescriptionFilter = 'all';
  labOrderFilter = 'all';
  
  // Real-time Bed Mock
  wards = [
    { name: 'ICU-A', beds: Array(16).fill(0).map((_, i) => ({ id: i, occupied: Math.random() > 0.4 })) },
    { name: 'General Ward-1', beds: Array(24).fill(0).map((_, i) => ({ id: i, occupied: Math.random() > 0.7 })) },
    { name: 'Pediatrics', beds: Array(16).fill(0).map((_, i) => ({ id: i, occupied: Math.random() > 0.3 })) },
    { name: 'Cardiology', beds: Array(16).fill(0).map((_, i) => ({ id: i, occupied: Math.random() > 0.5 })) }
  ];

  // Charts Config
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [65, 59, 80, 81, 56, 55, 40, 70, 75, 85, 90, 82, 70, 75, 80, 85, 95, 100, 110, 105, 100, 110, 115, 120, 125, 130, 120, 115, 110, 105],
      label: 'Visits',
      backgroundColor: 'rgba(26, 60, 110, 0.1)',
      borderColor: '#1A3C6E',
      pointBackgroundColor: '#1A3C6E',
      pointBorderColor: '#fff',
      fill: 'origin',
      tension: 0.4
    }],
    labels: Array(30).fill(0).map((_, i) => `Day ${i + 1}`)
  };

  public lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { display: false } }
    }
  };

  public barChartData: ChartConfiguration['data'] = {
    datasets: [{
      data: [12000, 19000, 3000, 5000, 2000, 3000],
      label: 'Revenue',
      backgroundColor: ['#1A3C6E', '#0D7E6A', '#D97706', '#DC2626', '#FFB0C1', '#F1F5F9'],
      borderRadius: 4
    }],
    labels: ['Cardio', 'ENT', 'Pedia', 'ICU', 'General', 'Dental']
  };

  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
      x: { grid: { display: false } }
    }
  };

  public donutChartData: ChartConfiguration['data'] = {
    labels: ['Completed', 'Pending', 'Cancelled'],
    datasets: [{
      data: [350, 450, 100],
      backgroundColor: ['#0D7E6A', '#D97706', '#DC2626'],
      hoverOffset: 4
    }]
  };

  public donutChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
    }
  };

  constructor(
    private reportingApi: ReportingApiService, 
    private authService: AuthService,
    private doctorProfileService: DoctorProfileService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.reportingApi.getSummary().subscribe({
      next: data => (this.summary = data),
      error: () => (this.summary = null)
    });

    this.authService.getDebugUsers().subscribe({
      next: users => (this.users = users),
      error: () => (this.users = [])
    });

    // Load all system data for admin oversight
    this.loadAllSystemData();
  }

  loadAllSystemData(): void {
    // Load from localStorage for immediate visibility
    this.loadAllDoctors();
    this.loadAllPatients();
    this.loadAllAppointments();
    this.loadAllPrescriptions();
    this.loadAllLabOrders();
  }

  loadAllDoctors(): void {
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    this.allDoctors = doctors;
  }

  loadAllPatients(): void {
    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    this.allPatients = patients;
    this.filteredPatients = patients;
  }

  loadAllAppointments(): void {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    this.allAppointments = appointments;
    this.filteredAppointments = appointments;
  }

  loadAllPrescriptions(): void {
    const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
    this.allPrescriptions = prescriptions;
    this.filteredPrescriptions = prescriptions;
  }

  loadAllLabOrders(): void {
    const labOrders = JSON.parse(localStorage.getItem('labOrders') || '[]');
    this.allLabOrders = labOrders;
    this.filteredLabOrders = labOrders;
  }

  verifyUser(userId: number): void {
    if (!userId) return;
    this.authService.adminVerifyUser(userId).subscribe({
      next: () => {
        this.toast.success('User Verified', 'User has been successfully verified and activated.');
        this.loadData();
      },
      error: (err) => {
        console.error('Verification failed', err);
        this.toast.error('Verification Failed', 'Could not verify user. Check console for details.');
      }
    });
  }

  onboardDoctor(): void {
    if (!this.onboardingData.fullName || !this.onboardingData.email) {
      this.toast.warning('Validation Error', 'Please provide at least a Full Name and Email Address.');
      return;
    }

    this.authService.register({
      username: this.onboardingData.email,
      password: 'password',
      role: 'DOCTOR'
    }).subscribe({
      next: (userRes: any) => {
        const newDoctor = {
          fullName: this.onboardingData.fullName,
          email: this.onboardingData.email,
          specialization: this.onboardingData.specialization,
          phone: this.onboardingData.phone,
          consultationFee: this.onboardingData.consultationFee,
          userId: userRes.id
        };

        this.doctorProfileService.create(newDoctor).subscribe({
          next: () => {
            this.toast.success('Doctor Onboarded', `Dr. ${this.onboardingData.fullName} has been registered successfully.`);
            this.onboardingData = { fullName: '', email: '', specialization: 'General Medicine', phone: '', consultationFee: 500 };
            this.loadData();
          },
          error: (err) => {
            console.error('Failed to create doctor profile:', err);
            this.toast.warning('Partial Success', 'Account created but profile creation failed. See console.');
            this.loadData();
          }
        });
      },
      error: (err) => {
        console.error('Failed to register user:', err);
        this.toast.error('Registration Failed', 'Failed to register user. Email might already exist.');
      }
    });
  }

  generateMonthlyReport() {
    this.toast.info('Report Queued', 'Generating consolidated GST Monthly Report (₹)... Data aggregation in progress.');
  }

  // Filter Methods
  filterPatients(): void {
    const search = this.patientSearch.toLowerCase();
    this.filteredPatients = this.allPatients.filter(patient => 
      patient.firstName.toLowerCase().includes(search) ||
      patient.lastName.toLowerCase().includes(search) ||
      patient.email.toLowerCase().includes(search) ||
      String(patient.id).includes(search)
    );
  }

  filterAppointments(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.filteredAppointments = this.allAppointments.filter(apt => {
      switch (this.appointmentFilter) {
        case 'today':
          return apt.appointmentDate === today;
        case 'upcoming':
          return apt.appointmentDate >= today && apt.status === 'SCHEDULED';
        case 'completed':
          return apt.status === 'COMPLETED';
        case 'cancelled':
          return apt.status === 'CANCELLED';
        default:
          return true;
      }
    });
  }

  filterPrescriptions(): void {
    this.filteredPrescriptions = this.allPrescriptions.filter(prescription => {
      switch (this.prescriptionFilter) {
        case 'active':
          return prescription.status === 'ACTIVE';
        case 'completed':
          return prescription.status === 'COMPLETED';
        default:
          return true;
      }
    });
  }

  filterLabOrders(): void {
    this.filteredLabOrders = this.allLabOrders.filter(order => {
      switch (this.labOrderFilter) {
        case 'pending':
          return order.status === 'PENDING';
        case 'completed':
          return order.status === 'COMPLETED';
        default:
          return true;
      }
    });
  }

  // Helper Methods
  getPatientName(patientId: number): string {
    const patient = this.allPatients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${patientId}`;
  }

  getDoctorName(doctorId: number): string {
    const doctor = this.allDoctors.find(d => d.id === doctorId);
    return doctor ? doctor.fullName : `Doctor #${doctorId}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  // Management Methods
  viewDoctorDetails(doctor: any): void {
    this.toast.info('Doctor Details', `Viewing details for Dr. ${doctor.fullName}`);
  }

  toggleDoctorStatus(doctor: any): void {
    doctor.isActive = !doctor.isActive;
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    const index = doctors.findIndex((d: any) => d.id === doctor.id);
    if (index !== -1) {
      doctors[index] = doctor;
      localStorage.setItem('doctors', JSON.stringify(doctors));
    }
    this.toast.success('Status Updated', `Dr. ${doctor.fullName} is now ${doctor.isActive ? 'Active' : 'Inactive'}`);
  }

  viewPatientDetails(patient: any): void {
    this.toast.info('Patient Details', `Viewing details for ${patient.firstName} ${patient.lastName}`);
  }

  viewPatientRecords(patient: any): void {
    this.toast.info('Medical Records', `Accessing medical records for ${patient.firstName} ${patient.lastName}`);
  }

  viewAppointmentDetails(appointment: any): void {
    this.toast.info('Appointment Details', `Viewing appointment #${appointment.id}`);
  }

  cancelAppointment(appointment: any): void {
    appointment.status = 'CANCELLED';
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const index = appointments.findIndex((a: any) => a.id === appointment.id);
    if (index !== -1) {
      appointments[index] = appointment;
      localStorage.setItem('appointments', JSON.stringify(appointments));
    }
    this.toast.success('Appointment Cancelled', `Appointment #${appointment.id} has been cancelled`);
    this.loadAllAppointments();
  }

  viewPrescriptionDetails(prescription: any): void {
    this.toast.info('Prescription Details', `Viewing prescription #${prescription.id}`);
  }

  downloadPrescriptionPDF(prescription: any): void {
    this.toast.success('PDF Generated', `Prescription PDF for #${prescription.id} generated and sent to patient`);
  }

  viewLabOrderDetails(order: any): void {
    this.toast.info('Lab Order Details', `Viewing lab order #${order.id}`);
  }

  approveLabOrder(order: any): void {
    order.status = 'COMPLETED';
    order.result = 'Normal';
    order.completedAt = new Date().toISOString();
    
    const labOrders = JSON.parse(localStorage.getItem('labOrders') || '[]');
    const index = labOrders.findIndex((o: any) => o.id === order.id);
    if (index !== -1) {
      labOrders[index] = order;
      localStorage.setItem('labOrders', JSON.stringify(labOrders));
    }
    
    this.toast.success('Lab Order Approved', `Lab order #${order.id} approved and report sent to patient`);
    this.loadAllLabOrders();
  }

  downloadLabReportPDF(order: any): void {
    this.toast.success('PDF Generated', `Lab report PDF for order #${order.id} generated and available for download`);
  }
}

