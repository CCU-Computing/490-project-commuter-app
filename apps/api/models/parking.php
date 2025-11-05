<?php include "commheader.php"; ?>
<main>
	<section class="parking-intro">
		<h2>Parking Statuses</h2>
		<p>
			Below you can see an interactive map showing the current status of each
			CCU parking lot.<br>Bus routes are included as well.
		</p>
	</section>

	<section class="parking-map-wrapper" aria-label="Interactive parking availability map">
		<div id="map"></div>
		<p class="parking-map-note">
			Lot colors shift from green (available) toward red as they fill. Planned events force a solid red overlay.
		</p>
	</section>

	<section class="parking-selector">
		<h2>Select A Parking Lot</h2>
		<p>
			Use the dropdown menu to see a specific parking lot's data.<br>
			To see a map of campus, click here:
			<a href="https://www.coastal.edu/map/" target="_blank" rel="noopener">Campus Map</a>
		</p>
		<?php include "dropdown.php"; ?>

		<section class="hidden">
			<h3>A Parking Lot</h3>
			<ul>
				<li>Location: circle in front of the Wall College of Business</li>
				<li>Closest Shuttle Stop: (Brittain Hall)</li>
			</ul>
		</section>
		<section class="hidden">
			<h3>AA Parking Lot</h3>
			<ul>
				<li>Location: Outside the HTC Center</li>
				<li>Closest Shuttle Stop: (Brittain Hall)</li>
				<li>Parking Type: Limited Time**</li>
			</ul>
		</section>
		<section class="hidden">
			<h3>B Parking Lot</h3>
			<ul>
				<li>Location: Outside Penny Hall (formerly Academic Office 2)</li>
				<li>Closest Shuttle Stop: (Brittain Hall)</li>
				<li>Parking Type: </li>
			</ul>
		</section>
		<section class="hidden">
			<h3>BB Parking Lot</h3>
			<ul>
				<li>Location:</li>
				<li>Closest Shuttle Stop:</li>
				<li>Parking Type:</li>
			</ul>
		</section>
	</section>
</main>
<script
	src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
	crossorigin=""
></script>
<script>
	window.ccuParkingApiBase = <?php echo json_encode(getenv('PARKING_API_BASE') ?: 'http://127.0.0.1:3000'); ?>;
</script>
<script>
<?php include __DIR__ . '/../src/parkingStatus.js'; ?>
</script>
<?php include "commfooter.php"; ?>
