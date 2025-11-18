<?php include "commheader.php"; ?>

<main class="container mb-5">
	<section class="mb-4">
		<h2>Parking Lot Fulfillment Stats</h2>
		<p>
			Here you can submit current parking lot fulfillment and view
			the historical records stored by the system.
		</p>
	</section>

	<section class="mb-4">
		<h3>Submit Current Fulfillment</h3>
		<p class="small text-muted">
			This form sends data directly to the commuter API 
			(<code>/api/fulfillment</code>).
		</p>

		<form id="fulfillment-form" class="row g-3">
			<!-- Basic meta; optional, mostly for humans -->
			<div class="col-md-4">
				<label for="firstName" class="form-label">First Name</label>
				<input type="text" id="firstName" name="firstName" class="form-control">
			</div>
			<div class="col-md-4">
				<label for="lastName" class="form-label">Last Name</label>
				<input type="text" id="lastName" name="lastName" class="form-control">
			</div>
			<div class="col-md-4">
				<label for="email" class="form-label">Email</label>
				<input type="email" id="email" name="email" class="form-control">
			</div>

			<div class="col-md-3">
				<label for="date" class="form-label">Date</label>
				<input type="date" id="date" name="date" class="form-control">
			</div>
			<div class="col-md-3">
				<label for="time" class="form-label">Time</label>
				<input type="time" id="time" name="time" class="form-control">
			</div>

			<div class="col-md-3">
				<label for="lot" class="form-label">Parking Lot</label>
				<?php include "dropdown.php"; ?>
			</div>

			<div class="col-md-3">
				<label for="percent" class="form-label">Fulfillment (%)</label>
				<input type="number" id="percent" name="percent" class="form-control" min="0" max="100" required>
			</div>

			<div class="col-12">
				<label for="explain" class="form-label">Further Explanation</label>
				<textarea id="explain" name="explain" rows="4" class="form-control"
				          placeholder="Example: Game day traffic, construction blocking spaces, etc."></textarea>
			</div>

			<div class="col-12">
				<div class="form-check">
					<input class="form-check-input" type="checkbox" value="1" id="special_event" name="special_event">
					<label class="form-check-label" for="special_event">
						Special event (game day, concert, etc.)
					</label>
				</div>
			</div>

			<div class="col-12">
				<button type="submit" class="btn btn-primary">Submit Fulfillment</button>
				<span id="submit-status" class="ms-3 small"></span>
			</div>
		</form>
	</section>

	<section>
		<h3>Recent Fulfillment Records</h3>
		<p class="small text-muted">
			Data loaded from <code>/api/fulfillment</code>.
		</p>

		<div class="table-responsive">
			<table class="table table-sm table-striped align-middle">
				<thead>
					<tr>
						<th scope="col">Timestamp</th>
						<th scope="col">Lot</th>
						<th scope="col">Fulfillment (%)</th>
						<th scope="col">Special Event</th>
						<th scope="col">Notes</th>
					</tr>
				</thead>
				<tbody id="fulfillment-body">
					<tr><td colspan="5">Loading data...</td></tr>
				</tbody>
			</table>
		</div>
	</section>
</main>

<script>
const API_BASE        = 'http://localhost:3000';  
const form            = document.getElementById('fulfillment-form');
const submitStatusEl  = document.getElementById('submit-status');
const historyTbody    = document.getElementById('fulfillment-body');
const lotSelectStats  = document.getElementById('lot'); // same id as dropdown.php

async function loadFulfillmentHistory() {
  try {
    const res = await fetch(`${API_BASE}/fulfillment`);
    if (!res.ok) throw new Error('Failed to load fulfillment history');

    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      historyTbody.innerHTML = '<tr><td colspan="5">No records yet.</td></tr>';
      return;
    }

    historyTbody.innerHTML = rows.map(r => {
      const pct = (r.occupied_spots != null && r.capacity)
        ? Math.round((Number(r.occupied_spots) / Number(r.capacity)) * 100) + '%'
        : (r.fulfillment_pct != null)
          ? Math.round(Number(r.fulfillment_pct) * 100) + '%'
          : (r.raw_occupied != null && r.capacity)
            ? Math.round((Number(r.raw_occupied) / Number(r.capacity)) * 100) + '%'
            : (r.raw_occupied != null && Number(r.raw_occupied) <= 100)
              ? Math.round(Number(r.raw_occupied)) + '%'
              : '';

      const occupiedDisplay = (r.occupied_spots != null && r.capacity)
        ? `${r.occupied_spots}/${r.capacity}`
        : (r.raw_occupied != null)
          ? `${r.raw_occupied}${r.capacity ? '/' + r.capacity : ''}`
          : '';

      return `
        <tr>
          <td>${r.sample_date ? new Date(r.sample_date).toLocaleDateString() : ''}</td>
          <td>${r.display_name || r.code || r.lot_id || ''}</td>
          <td>${pct}${occupiedDisplay ? ' (' + occupiedDisplay + ')' : ''}</td>
          <td>-</td>
          <td>${(r.notes || '').toString().slice(0, 120)}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading fulfillment history:', err);
    historyTbody.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>';
  }
}


form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitStatusEl.textContent = '';

  const lotCode = lotSelectStats.value;
  console.log('lotCode on submit =', lotCode);   // DEBUG

  // No real lot selected
  if (!lotCode) {
    submitStatusEl.textContent = 'Please select a parking lot.';
    submitStatusEl.classList.remove('text-success');
    submitStatusEl.classList.add('text-danger');
    return;
  }

  const payload = {
    lot_code: lotCode,
    occupied_count: Number(document.getElementById('percent').value),
    sample_date: document.getElementById('date').value || null,
    notes: document.getElementById('explain').value.trim() || null
  };

  console.log('payload about to send:', payload);  // DEBUG

  try {
    const res = await fetch(`${API_BASE}/fulfillment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('API error:', res.status, errJson);
      throw new Error('bad status');
    }

    submitStatusEl.textContent = 'Saved!';
    submitStatusEl.classList.remove('text-danger');
    submitStatusEl.classList.add('text-success');
    await loadFulfillmentHistory();
  } catch (err) {
    console.error(err);
    submitStatusEl.textContent = 'Error saving record.';
    submitStatusEl.classList.remove('text-success');
    submitStatusEl.classList.add('text-danger');
  }
});

// Load history on first render
document.addEventListener('DOMContentLoaded', loadFulfillmentHistory);
</script>

<?php include "commfooter.php"; ?>
